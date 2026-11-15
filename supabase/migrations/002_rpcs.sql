-- PRISMA 002: funções executadas com verificação de perfil e contratos tipados.
CREATE OR REPLACE FUNCTION vector_search(p_profile_id uuid,p_embedding vector(1536),p_limit int DEFAULT 10)
RETURNS TABLE(id uuid,document_id uuid,content text,similarity real)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT dc.id,dc.document_id,dc.content,(1-(dc.embedding<=>p_embedding))::real
 FROM document_chunk dc JOIN study_profile sp ON sp.id=dc.profile_id
 WHERE dc.profile_id=p_profile_id AND (sp.user_id=auth.uid() OR auth.role()='service_role') AND dc.embedding IS NOT NULL
 ORDER BY dc.embedding<=>p_embedding LIMIT greatest(1,least(p_limit,100));
$$;

CREATE OR REPLACE FUNCTION fsrs_update(p_card_id uuid,p_rating int,p_now timestamptz DEFAULT now())
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE card flashcard%ROWTYPE; stability_new real; difficulty_new real; days real; next_due timestamptz;
BEGIN
 IF p_rating NOT BETWEEN 1 AND 4 THEN RAISE EXCEPTION 'Avaliação inválida'; END IF;
 SELECT * INTO card FROM flashcard WHERE id=p_card_id FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM study_profile WHERE id=card.profile_id AND(user_id=auth.uid() OR auth.role()='service_role')) THEN RAISE EXCEPTION 'Flashcard não encontrado'; END IF;
 difficulty_new:=card.difficulty;
 IF p_rating=1 THEN stability_new:=greatest(card.stability*.1,.01);difficulty_new:=least(card.difficulty+.2,1);days:=0;
 ELSIF p_rating=2 THEN stability_new:=greatest(card.stability*1.3,.01);difficulty_new:=least(card.difficulty+.05,1);days:=greatest(card.stability*.5,1);
 ELSIF p_rating=3 THEN stability_new:=greatest(card.stability*2.5,.01);days:=greatest(card.stability,1);
 ELSE stability_new:=greatest(card.stability*4,.01);days:=greatest(card.stability*1.3,1);END IF;
 difficulty_new:=greatest(difficulty_new,.1);next_due:=p_now+days*interval '1 day';
 UPDATE flashcard SET difficulty=difficulty_new,stability=stability_new,retrievability=.9,last_review=p_now,next_review=next_due,reps=reps+1,lapses=lapses+CASE WHEN p_rating=1 THEN 1 ELSE 0 END WHERE id=p_card_id;
 RETURN jsonb_build_object('stability',stability_new,'difficulty',difficulty_new,'interval_days',days,'next_review',next_due);
END;
$$;

CREATE OR REPLACE FUNCTION create_flashcards_from_document(p_profile_id uuid,p_deck_id uuid,p_document_id uuid,p_cards jsonb)
RETURNS TABLE(id uuid,front text,back text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM study_profile WHERE study_profile.id=p_profile_id AND(user_id=auth.uid() OR auth.role()='service_role')) THEN RAISE EXCEPTION 'Acesso negado';END IF;
 IF NOT EXISTS(SELECT 1 FROM flashcard_deck WHERE flashcard_deck.id=p_deck_id AND profile_id=p_profile_id) THEN RAISE EXCEPTION 'Coleção não encontrada';END IF;
 IF NOT EXISTS(SELECT 1 FROM document WHERE document.id=p_document_id AND profile_id=p_profile_id) THEN RAISE EXCEPTION 'Documento não encontrado';END IF;
 FOR item IN SELECT * FROM jsonb_array_elements(p_cards) LOOP
  RETURN QUERY INSERT INTO flashcard AS f(deck_id,profile_id,type,front,back,extra_data,tags,source_type,source_id)
  VALUES(p_deck_id,p_profile_id,COALESCE(item->>'type','basic')::flashcard_type,item->>'front',item->>'back',item->'extra_data',ARRAY(SELECT jsonb_array_elements_text(COALESCE(item->'tags','[]'::jsonb))),'document',p_document_id)
  RETURNING f.id,f.front,f.back;
 END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION create_questions_from_document(p_profile_id uuid,p_document_id uuid,p_questions jsonb)
RETURNS TABLE(id uuid,stem text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM study_profile WHERE study_profile.id=p_profile_id AND(user_id=auth.uid() OR auth.role()='service_role')) THEN RAISE EXCEPTION 'Acesso negado';END IF;
 IF NOT EXISTS(SELECT 1 FROM document WHERE document.id=p_document_id AND profile_id=p_profile_id) THEN RAISE EXCEPTION 'Documento não encontrado';END IF;
 FOR item IN SELECT * FROM jsonb_array_elements(p_questions) LOOP
  RETURN QUERY INSERT INTO question AS q(profile_id,stem,type,alternatives,correct_answer,explanation,subject,topic,difficulty,source_type,source_id,tags)
  VALUES(p_profile_id,item->>'stem',COALESCE(item->>'type','essay')::question_type,item->'alternatives',item->>'correct_answer',item->>'explanation',item->>'subject',item->>'topic',COALESCE((item->>'difficulty')::real,.5),'document',p_document_id,ARRAY(SELECT jsonb_array_elements_text(COALESCE(item->'tags','[]'::jsonb))))
  RETURNING q.id,q.stem;
 END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION log_error(p_profile_id uuid,p_question_id uuid,p_attempt_id uuid,p_cause error_cause,p_description text,p_subject text,p_topic text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM study_profile WHERE id=p_profile_id AND(user_id=auth.uid() OR auth.role()='service_role')) THEN RAISE EXCEPTION 'Acesso negado';END IF;
 IF p_question_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM question WHERE id=p_question_id AND profile_id=p_profile_id) THEN RAISE EXCEPTION 'Questão não encontrada';END IF;
 IF p_attempt_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM question_attempt WHERE id=p_attempt_id AND profile_id=p_profile_id) THEN RAISE EXCEPTION 'Tentativa não encontrada';END IF;
 INSERT INTO error_log(profile_id,question_id,attempt_id,cause,description,subject,topic) VALUES(p_profile_id,p_question_id,p_attempt_id,p_cause,p_description,p_subject,p_topic);
END;
$$;

CREATE OR REPLACE FUNCTION update_goal_progress(p_goal_id uuid,p_increment numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item record;value_new numeric;
BEGIN
 SELECT g.*,sp.user_id INTO item FROM goal g JOIN study_profile sp ON sp.id=g.profile_id WHERE g.id=p_goal_id FOR UPDATE OF g;
 IF NOT FOUND THEN RAISE EXCEPTION 'Meta não encontrada';END IF;
 IF auth.role() IS DISTINCT FROM 'service_role' AND item.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Meta não encontrada';END IF;
 value_new:=item.current_value+p_increment;
 UPDATE goal SET current_value=value_new,achieved=value_new>=item.target_value WHERE goal.id=p_goal_id;
 RETURN jsonb_build_object('current_value',value_new,'achieved',value_new>=item.target_value,'target_value',item.target_value);
END;
$$;

CREATE TRIGGER trg_deck_search AFTER INSERT OR UPDATE OR DELETE ON flashcard_deck FOR EACH ROW EXECUTE FUNCTION sync_search_index();
REVOKE EXECUTE ON FUNCTION vector_search(uuid,vector,int),fsrs_update(uuid,int,timestamptz),create_flashcards_from_document(uuid,uuid,uuid,jsonb),create_questions_from_document(uuid,uuid,jsonb),log_error(uuid,uuid,uuid,error_cause,text,text,text),update_goal_progress(uuid,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION vector_search(uuid,vector,int),fsrs_update(uuid,int,timestamptz),create_flashcards_from_document(uuid,uuid,uuid,jsonb),create_questions_from_document(uuid,uuid,jsonb),log_error(uuid,uuid,uuid,error_cause,text,text,text),update_goal_progress(uuid,numeric) TO authenticated,service_role;
