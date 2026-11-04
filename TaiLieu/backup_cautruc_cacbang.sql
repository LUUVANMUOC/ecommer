--
-- PostgreSQL database dump
--

\restrict co8UXRboCoxi0OwrnjQ6j0i3kK5NQCs8cntsVQN4HSPBY2COFwkuSIi0GKmGGE0

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
-- Name: kho; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kho (
    kho_ma character varying(10) NOT NULL,
    kho_ten character varying(50) NOT NULL,
    kho_hinhanh text NOT NULL,
    dc_ma character varying(10) NOT NULL,
    dvvc_ma character varying(10) NOT NULL,
    kho_hashpass text
);


ALTER TABLE public.kho OWNER TO postgres;

--
-- Name: phieu_tat_toan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phieu_tat_toan (
    ptt_ma character varying(10) NOT NULL,
    kho_ma character varying(10) NOT NULL,
    ptt_tong_tien_san numeric(18,2) NOT NULL,
    ptt_tong_tien_shop numeric(18,2) NOT NULL,
    ptt_ngay_tat_toan timestamp with time zone DEFAULT now() NOT NULL,
    ptt_trang_thai character varying(20) DEFAULT 'DA_THANH_TOAN'::character varying NOT NULL
);


ALTER TABLE public.phieu_tat_toan OWNER TO postgres;

--
-- Name: thongtinnhantien_gianhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongtinnhantien_gianhang (
    gh_ma character varying(10) NOT NULL,
    nh_ma character varying(10) CONSTRAINT thongtinnhantien_gianhang_nganhang_ma_not_null NOT NULL,
    ttnt_gianhang_sotaikhoan character varying(14) NOT NULL,
    ttnt_gianhang_tentaikhoan character varying(50)
);


ALTER TABLE public.thongtinnhantien_gianhang OWNER TO postgres;

--
-- Name: thongtinnhantien_stmdt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongtinnhantien_stmdt (
    stmdt_ma character varying(10) NOT NULL,
    nganhang_ma character varying(10) NOT NULL,
    ttnt_stmdt_sotaikhoan character varying(14) NOT NULL,
    ttnt_stmdt_tentaikhoan character varying(50)
);


ALTER TABLE public.thongtinnhantien_stmdt OWNER TO postgres;

--
-- Name: kho kho_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kho
    ADD CONSTRAINT kho_pkey PRIMARY KEY (kho_ma);


--
-- Name: phieu_tat_toan phieu_tat_toan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_tat_toan
    ADD CONSTRAINT phieu_tat_toan_pkey PRIMARY KEY (ptt_ma);


--
-- Name: thongtinnhantien_gianhang thongtinnhantien_gianhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhantien_gianhang
    ADD CONSTRAINT thongtinnhantien_gianhang_pkey PRIMARY KEY (gh_ma, nh_ma);


--
-- Name: thongtinnhantien_stmdt thongtinnhantien_stmdt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhantien_stmdt
    ADD CONSTRAINT thongtinnhantien_stmdt_pkey PRIMARY KEY (stmdt_ma, nganhang_ma);


--
-- Name: phieu_tat_toan fk_ptt_kho; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_tat_toan
    ADD CONSTRAINT fk_ptt_kho FOREIGN KEY (kho_ma) REFERENCES public.kho(kho_ma);


--
-- Name: kho kho_dc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kho
    ADD CONSTRAINT kho_dc_ma_fkey FOREIGN KEY (dc_ma) REFERENCES public.diachi(dc_ma);


--
-- Name: kho kho_dvvc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kho
    ADD CONSTRAINT kho_dvvc_ma_fkey FOREIGN KEY (dvvc_ma) REFERENCES public.donvivanchuyen(dvvc_ma);


--
-- Name: thongtinnhantien_gianhang thongtinnhantien_gianhang_gh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhantien_gianhang
    ADD CONSTRAINT thongtinnhantien_gianhang_gh_ma_fkey FOREIGN KEY (gh_ma) REFERENCES public.gianhang(gh_ma);


--
-- Name: thongtinnhantien_gianhang thongtinnhantien_gianhang_nganhang_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhantien_gianhang
    ADD CONSTRAINT thongtinnhantien_gianhang_nganhang_ma_fkey FOREIGN KEY (nh_ma) REFERENCES public.nganhang(nhg_ma);


--
-- Name: thongtinnhantien_stmdt thongtinnhantien_stmdt_nganhang_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhantien_stmdt
    ADD CONSTRAINT thongtinnhantien_stmdt_nganhang_ma_fkey FOREIGN KEY (nganhang_ma) REFERENCES public.nganhang(nhg_ma);


--
-- Name: thongtinnhantien_stmdt thongtinnhantien_stmdt_stmdt_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhantien_stmdt
    ADD CONSTRAINT thongtinnhantien_stmdt_stmdt_ma_fkey FOREIGN KEY (stmdt_ma) REFERENCES public.san_thuong_mai_dien_tu(stmdt_ma);


--
-- PostgreSQL database dump complete
--

\unrestrict co8UXRboCoxi0OwrnjQ6j0i3kK5NQCs8cntsVQN4HSPBY2COFwkuSIi0GKmGGE0

