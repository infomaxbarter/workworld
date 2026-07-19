
CREATE OR REPLACE FUNCTION public.mci_compute_row(row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.mci_cities%ROWTYPE;
  it numeric; dd numeric; cpb numeric; cpf numeric; k int;
BEGIN
  SELECT * INTO r FROM public.mci_cities WHERE id = row_id;
  IF NOT FOUND THEN RETURN; END IF;

  it := ((r.exp_billion_usd + r.imp_billion_usd) / 10.0) * (r.exp_billion_usd / GREATEST(r.imp_billion_usd, 0.0001));
  dd := (r.y_ratio / GREATEST(r.e_ratio, 0.001)) * (r.b_rate / 2.1);
  IF dd < 0.7 THEN dd := 0.7; END IF;
  IF dd > 1.3 THEN dd := 1.3; END IF;

  cpb := 10 * log(GREATEST(r.n_population, 1))
         + r.g_gdp_per_capita/1000.0
         + r.f_firms/10000.0
         + r.u_universities * 1.5
         + r.s_industrial_zones
         + r.t_tech_parks * 3
         + r.p_search * 2.5
         + r.m_loc/50.0
         + r.h_vc_access * 2
         + r.t_flow * 1.5
         + r.ai_index * 2
         + r.esg_score * 1.2
         + it;

  cpf := cpb * (1 + r.sigma) * COALESCE(r.delta_pulse, 1) * COALESCE(r.net_syn, 1) * dd;
  k := 3 + FLOOR(62 * (cpf / 600.0));
  IF cpf > 600 OR k > 65 THEN k := 65; END IF;
  IF k < 3 THEN k := 3; END IF;

  UPDATE public.mci_cities SET cp_final = ROUND(cpf::numeric, 2), seat_quota = k, updated_at = now() WHERE id = row_id;
END;
$$;

-- Compute for all cities lacking cp_final
DO $$
DECLARE rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM public.mci_cities WHERE cp_final IS NULL LOOP
    PERFORM public.mci_compute_row(rec.id);
  END LOOP;
END $$;
