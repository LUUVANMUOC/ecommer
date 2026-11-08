--
-- PostgreSQL database dump
--

\restrict 0dqsYRPrQUV7w2LDDbEGHvHFkNlFQcCyV3Scx7lQaFfDCfRBjO8zyCYl1IVBEVS

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chitiet_tat_toan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chitiet_tat_toan (
    ptt_ma character varying(10) NOT NULL,
    dts_ma character varying(10) NOT NULL,
    ctt_tien_san numeric(18,2) NOT NULL,
    ctt_tien_shop numeric(18,2) NOT NULL
);


ALTER TABLE public.chitiet_tat_toan OWNER TO postgres;

--
-- Name: donhangtheoshop; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donhangtheoshop (
    dts_ma character varying(10) NOT NULL,
    dts_ngaylap timestamp with time zone DEFAULT now() NOT NULL,
    dts_thoidiemdukiengiao date NOT NULL,
    dts_ghichu text,
    dts_tongtienhang numeric(18,2) NOT NULL,
    dts_tienvanchuyen numeric(18,2) NOT NULL,
    dts_tongtiengiamgia numeric(18,2) DEFAULT 0 NOT NULL,
    dts_tongtienkhachhangthanhtoan numeric(18,2) NOT NULL,
    dts_tongtienphisan numeric(18,2) NOT NULL,
    dts_trangthaithanhtoan boolean DEFAULT false NOT NULL,
    dm_ma character varying(10) NOT NULL,
    gh_ma character varying(10) NOT NULL,
    mgg_shop_ma character varying(10),
    mgg_ma character varying(10),
    mgg_vc_ma character varying(10),
    klkh_ma character varying(10) NOT NULL,
    dc_layhangma character varying(10) NOT NULL,
    dvvc_ma character varying(10) NOT NULL,
    dts_tonggiamgiavanchuyen numeric(18,2) DEFAULT 0 NOT NULL,
    dts_tonggiamgiashop numeric(18,2) DEFAULT 0 NOT NULL,
    CONSTRAINT donhangtheoshop_dts_tienvanchuyen_check CHECK ((dts_tienvanchuyen >= (0)::numeric)),
    CONSTRAINT donhangtheoshop_dts_tongtiengiamgia_check CHECK ((dts_tongtiengiamgia >= (0)::numeric)),
    CONSTRAINT donhangtheoshop_dts_tongtienhang_check CHECK ((dts_tongtienhang >= (0)::numeric)),
    CONSTRAINT donhangtheoshop_dts_tongtienkhachhangthanhtoan_check CHECK ((dts_tongtienkhachhangthanhtoan >= (0)::numeric)),
    CONSTRAINT donhangtheoshop_dts_tongtienphisan_check CHECK ((dts_tongtienphisan >= (0)::numeric))
);


ALTER TABLE public.donhangtheoshop OWNER TO postgres;

--
-- Name: phieu_tat_toan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phieu_tat_toan (
    ptt_ma character varying(10) NOT NULL,
    kho_ma character varying(10) NOT NULL,
    ptt_tong_tien_san numeric(18,2) NOT NULL,
    ptt_tong_tien_shop numeric(18,2) NOT NULL,
    ptt_ngay_tat_toan timestamp with time zone DEFAULT now() NOT NULL,
    ptt_trang_thai character varying(20) DEFAULT 'CHO_THANH_TOAN'::character varying NOT NULL,
    ptt_trang_thai_thanh_toan character varying(20) DEFAULT 'CHO_THANH_TOAN'::character varying,
    ptt_thoi_diem_hoan_tat timestamp with time zone,
    CONSTRAINT phieu_tat_toan_ptt_trang_thai_thanh_toan_check CHECK (((ptt_trang_thai_thanh_toan)::text = ANY ((ARRAY['CHO_THANH_TOAN'::character varying, 'DA_THANH_TOAN'::character varying])::text[])))
);


ALTER TABLE public.phieu_tat_toan OWNER TO postgres;

--
-- Name: qr_thanh_toan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qr_thanh_toan (
    qr_ma character varying(50) NOT NULL,
    ptt_ma character varying(10) NOT NULL,
    qr_loai character varying(10) NOT NULL,
    gh_ma character varying(10),
    qr_so_tien numeric(18,2) NOT NULL,
    qr_trang_thai character varying(20) DEFAULT 'CHUA_THANH_TOAN'::character varying,
    qr_ma_giao_dich character varying(50),
    qr_thoi_diem_tt timestamp with time zone,
    tao_luc timestamp with time zone DEFAULT now(),
    CONSTRAINT qr_thanh_toan_qr_loai_check CHECK (((qr_loai)::text = ANY ((ARRAY['SAN'::character varying, 'SHOP'::character varying])::text[]))),
    CONSTRAINT qr_thanh_toan_qr_trang_thai_check CHECK (((qr_trang_thai)::text = ANY ((ARRAY['CHUA_THANH_TOAN'::character varying, 'DA_THANH_TOAN'::character varying])::text[])))
);


ALTER TABLE public.qr_thanh_toan OWNER TO postgres;

--
-- Name: chitiet_tat_toan chitiet_tat_toan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiet_tat_toan
    ADD CONSTRAINT chitiet_tat_toan_pkey PRIMARY KEY (ptt_ma, dts_ma);


--
-- Name: donhangtheoshop donhangtheoshop_dm_ma_gh_ma_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donhangtheoshop
    ADD CONSTRAINT donhangtheoshop_dm_ma_gh_ma_key UNIQUE (dm_ma, gh_ma);


--
-- Name: donhangtheoshop donhangtheoshop_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donhangtheoshop
    ADD CONSTRAINT donhangtheoshop_pkey PRIMARY KEY (dts_ma);


--
-- Name: phieu_tat_toan phieu_tat_toan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_tat_toan
    ADD CONSTRAINT phieu_tat_toan_pkey PRIMARY KEY (ptt_ma);


--
-- Name: qr_thanh_toan qr_thanh_toan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_thanh_toan
    ADD CONSTRAINT qr_thanh_toan_pkey PRIMARY KEY (qr_ma);


--
-- Name: idx_qr_ma_giao_dich; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_ma_giao_dich ON public.qr_thanh_toan USING btree (qr_ma_giao_dich);


--
-- Name: idx_qr_ptt_ma; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_ptt_ma ON public.qr_thanh_toan USING btree (ptt_ma);


--
-- Name: donhangtheoshop donhangtheoshop_dc_layhangma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donhangtheoshop
    ADD CONSTRAINT donhangtheoshop_dc_layhangma_fkey FOREIGN KEY (dc_layhangma) REFERENCES public.diachi(dc_ma);


--
-- Name: donhangtheoshop donhangtheoshop_dm_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donhangtheoshop
    ADD CONSTRAINT donhangtheoshop_dm_ma_fkey FOREIGN KEY (dm_ma) REFERENCES public.donhangkhachmua(dm_ma);


--
-- Name: donhangtheoshop donhangtheoshop_dvvc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donhangtheoshop
    ADD CONSTRAINT donhangtheoshop_dvvc_ma_fkey FOREIGN KEY (dvvc_ma) REFERENCES public.donvivanchuyen(dvvc_ma);


--
-- Name: donhangtheoshop donhangtheoshop_gh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donhangtheoshop
    ADD CONSTRAINT donhangtheoshop_gh_ma_fkey FOREIGN KEY (gh_ma) REFERENCES public.gianhang(gh_ma);


--
-- Name: donhangtheoshop donhangtheoshop_klkh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donhangtheoshop
    ADD CONSTRAINT donhangtheoshop_klkh_ma_fkey FOREIGN KEY (klkh_ma) REFERENCES public.khoiluongkienhang(klkh_ma);


--
-- Name: chitiet_tat_toan fk_cttt_dts; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiet_tat_toan
    ADD CONSTRAINT fk_cttt_dts FOREIGN KEY (dts_ma) REFERENCES public.donhangtheoshop(dts_ma);


--
-- Name: chitiet_tat_toan fk_cttt_ptt; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiet_tat_toan
    ADD CONSTRAINT fk_cttt_ptt FOREIGN KEY (ptt_ma) REFERENCES public.phieu_tat_toan(ptt_ma) ON DELETE CASCADE;


--
-- Name: phieu_tat_toan fk_ptt_kho; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_tat_toan
    ADD CONSTRAINT fk_ptt_kho FOREIGN KEY (kho_ma) REFERENCES public.kho(kho_ma);


--
-- Name: qr_thanh_toan qr_thanh_toan_ptt_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_thanh_toan
    ADD CONSTRAINT qr_thanh_toan_ptt_ma_fkey FOREIGN KEY (ptt_ma) REFERENCES public.phieu_tat_toan(ptt_ma);


--
-- PostgreSQL database dump complete
--

\unrestrict 0dqsYRPrQUV7w2LDDbEGHvHFkNlFQcCyV3Scx7lQaFfDCfRBjO8zyCYl1IVBEVS

