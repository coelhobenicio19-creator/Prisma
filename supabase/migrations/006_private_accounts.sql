-- PRISMA privado: somente as seis contas autorizadas. Nenhuma senha neste SQL.
CREATE SCHEMA IF NOT EXISTS prisma_private;
REVOKE ALL ON SCHEMA prisma_private FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS prisma_private.allowed_account (
  email text PRIMARY KEY CHECK(email=lower(trim(email)))
);
REVOKE ALL ON prisma_private.allowed_account FROM PUBLIC,anon,authenticated;
INSERT INTO prisma_private.allowed_account(email) VALUES
 ('coelhobenicio19@gmail.com'),('sugundousuario@gmail.com'),
 ('terceirousuario@gmail.com'),('quartousuario@gmail.com'),
 ('benicioias@gmail.com'),('beniciokyrios@gmail.com')
ON CONFLICT(email) DO NOTHING;

CREATE OR REPLACE FUNCTION prisma_private.check_account_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM prisma_private.allowed_account WHERE email=lower(trim(NEW.email))) THEN
    RAISE EXCEPTION 'Cadastro fechado. Esta conta não foi autorizada.' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION prisma_private.check_account_email() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS prisma_private_account_email ON auth.users;
CREATE TRIGGER prisma_private_account_email BEFORE INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION prisma_private.check_account_email();

CREATE OR REPLACE FUNCTION public.prisma_account_allowed()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT EXISTS(SELECT 1 FROM auth.users u JOIN prisma_private.allowed_account a ON a.email=lower(u.email) WHERE u.id=auth.uid());
$$;
REVOKE ALL ON FUNCTION public.prisma_account_allowed() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.prisma_account_allowed() TO authenticated,service_role;

-- Política restritiva adicional: também bloqueia contas antigas fora da lista.
DO $$ DECLARE item record; BEGIN
  FOR item IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity LOOP
    EXECUTE format('DROP POLICY IF EXISTS prisma_private_access ON public.%I',item.tablename);
    EXECUTE format('CREATE POLICY prisma_private_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING(public.prisma_account_allowed()) WITH CHECK(public.prisma_account_allowed())',item.tablename);
  END LOOP;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated,service_role;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated,service_role;
