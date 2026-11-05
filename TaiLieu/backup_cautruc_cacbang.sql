--
-- PostgreSQL database dump
--

\restrict h5he7YNucHp8tljphpzmj6Sef350UQOoKGmZLIGaOczTEt1kNhn5b9Hcf5gwuI7

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
-- Name: danhmucsanpham; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.danhmucsanpham (
    dmsp_ma character varying(10) NOT NULL,
    dmsp_ten character varying(50) NOT NULL,
    dmsp_mota text NOT NULL,
    dmsp_hinhanh text NOT NULL,
    gh_ma character varying(10) NOT NULL
);


ALTER TABLE public.danhmucsanpham OWNER TO postgres;

--
-- Name: sanpham; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sanpham (
    sp_ma character varying(10) NOT NULL,
    sp_ten character varying(50) NOT NULL,
    sp_mota text NOT NULL,
    sp_luotxem integer DEFAULT 0 NOT NULL,
    sp_luotthich integer DEFAULT 0 NOT NULL,
    sp_luotmua integer DEFAULT 0 NOT NULL,
    sp_diemdanhgiatrungbinh numeric(3,2) DEFAULT 0 NOT NULL,
    gh_ma character varying(10) NOT NULL,
    th_ma character varying(10),
    dmsp_ma character varying(10),
    CONSTRAINT sanpham_sp_diemdanhgiatrungbinh_check CHECK (((sp_diemdanhgiatrungbinh >= (0)::numeric) AND (sp_diemdanhgiatrungbinh <= (5)::numeric))),
    CONSTRAINT sanpham_sp_luotmua_check CHECK ((sp_luotmua >= 0)),
    CONSTRAINT sanpham_sp_luotthich_check CHECK ((sp_luotthich >= 0)),
    CONSTRAINT sanpham_sp_luotxem_check CHECK ((sp_luotxem >= 0))
);


ALTER TABLE public.sanpham OWNER TO postgres;

--
-- Name: danhmucsanpham danhmucsanpham_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danhmucsanpham
    ADD CONSTRAINT danhmucsanpham_pkey PRIMARY KEY (dmsp_ma);


--
-- Name: sanpham sanpham_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanpham
    ADD CONSTRAINT sanpham_pkey PRIMARY KEY (sp_ma);


--
-- Name: danhmucsanpham danhmucsanpham_gh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danhmucsanpham
    ADD CONSTRAINT danhmucsanpham_gh_ma_fkey FOREIGN KEY (gh_ma) REFERENCES public.gianhang(gh_ma);


--
-- Name: sanpham sanpham_dmsp_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanpham
    ADD CONSTRAINT sanpham_dmsp_ma_fkey FOREIGN KEY (dmsp_ma) REFERENCES public.danhmucsanpham(dmsp_ma);


--
-- Name: sanpham sanpham_gh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanpham
    ADD CONSTRAINT sanpham_gh_ma_fkey FOREIGN KEY (gh_ma) REFERENCES public.gianhang(gh_ma);


--
-- Name: sanpham sanpham_th_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanpham
    ADD CONSTRAINT sanpham_th_ma_fkey FOREIGN KEY (th_ma) REFERENCES public.thuonghieu(th_ma);


--
-- PostgreSQL database dump complete
--

\unrestrict h5he7YNucHp8tljphpzmj6Sef350UQOoKGmZLIGaOczTEt1kNhn5b9Hcf5gwuI7

