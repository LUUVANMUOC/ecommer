--
-- PostgreSQL database dump
--

\restrict X4OjCzRIH7dnDIB55Ovn6Mk6SvAdUBJQcA8pLAb7E8i9h8T79pLTdiyHfqgkhjz

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
-- Name: chitietdonhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chitietdonhang (
    dts_ma character varying(10) NOT NULL,
    ctsp_ma character varying(10) NOT NULL,
    ctdh_soluong integer NOT NULL,
    ctdh_dongia numeric(18,2) NOT NULL,
    ctdh_thanhtien numeric(18,2) NOT NULL,
    CONSTRAINT chitietdonhang_ctdh_dongia_check CHECK ((ctdh_dongia >= (0)::numeric)),
    CONSTRAINT chitietdonhang_ctdh_soluong_check CHECK ((ctdh_soluong > 0)),
    CONSTRAINT chitietdonhang_ctdh_thanhtien_check CHECK ((ctdh_thanhtien >= (0)::numeric))
);


ALTER TABLE public.chitietdonhang OWNER TO postgres;

--
-- Name: chitietgiohang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chitietgiohang (
    kh_ma character varying(10) NOT NULL,
    ctsp_ma character varying(10) NOT NULL,
    ctgh_soluong integer NOT NULL,
    ctgh_thoidiemthem timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chitietgiohang_ctgh_soluong_check CHECK ((ctgh_soluong > 0))
);


ALTER TABLE public.chitietgiohang OWNER TO postgres;

--
-- Name: chitietsanpham; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chitietsanpham (
    ctsp_ma character varying(10) NOT NULL,
    ctsp_ten character varying(256) NOT NULL,
    ctsp_mota text NOT NULL,
    ctsp_soluongton integer DEFAULT 0 NOT NULL,
    ctsp_chieudai numeric(6,2) NOT NULL,
    ctsp_chieurong numeric(6,2) NOT NULL,
    ctsp_khoiluong numeric(6,2) NOT NULL,
    ctsp_ngaytao timestamp with time zone DEFAULT now() NOT NULL,
    ctsp_luotxem integer DEFAULT 0 NOT NULL,
    ctsp_luotthich integer DEFAULT 0 NOT NULL,
    ctsp_luotmua integer DEFAULT 0 NOT NULL,
    sp_ma character varying(10) NOT NULL,
    nh_ma character varying(10) NOT NULL,
    ctsp_gianban numeric(18,2),
    ctsp_chieucao numeric(6,2) DEFAULT 1 NOT NULL,
    CONSTRAINT chitietsanpham_ctsp_chieudai_check CHECK ((ctsp_chieudai > (0)::numeric)),
    CONSTRAINT chitietsanpham_ctsp_chieurong_check CHECK ((ctsp_chieurong > (0)::numeric)),
    CONSTRAINT chitietsanpham_ctsp_khoiluong_check CHECK ((ctsp_khoiluong > (0)::numeric)),
    CONSTRAINT chitietsanpham_ctsp_luotmua_check CHECK ((ctsp_luotmua >= 0)),
    CONSTRAINT chitietsanpham_ctsp_luotthich_check CHECK ((ctsp_luotthich >= 0)),
    CONSTRAINT chitietsanpham_ctsp_luotxem_check CHECK ((ctsp_luotxem >= 0)),
    CONSTRAINT chitietsanpham_ctsp_soluongton_check CHECK ((ctsp_soluongton >= 0))
);


ALTER TABLE public.chitietsanpham OWNER TO postgres;

--
-- Name: chitiettrangthaidonhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chitiettrangthaidonhang (
    dts_ma character varying(10) NOT NULL,
    ttdh_ma character varying(10) NOT NULL,
    ctttdh_thoidiem timestamp with time zone NOT NULL,
    ctttdh_ghichu text
);


ALTER TABLE public.chitiettrangthaidonhang OWNER TO postgres;

--
-- Name: donhangkhachmua; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donhangkhachmua (
    dm_ma character varying(10) NOT NULL,
    dm_ngaylap timestamp with time zone DEFAULT now() NOT NULL,
    dm_tongtien numeric(18,2) NOT NULL,
    kh_ma character varying(10) NOT NULL,
    ttnh_ma character varying(10) NOT NULL,
    CONSTRAINT donhangkhachmua_dm_tongtien_check CHECK ((dm_tongtien >= (0)::numeric))
);


ALTER TABLE public.donhangkhachmua OWNER TO postgres;

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
-- Name: gianhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gianhang (
    gh_ma character varying(10) NOT NULL,
    gh_ten character varying(50) NOT NULL,
    gh_mota text NOT NULL,
    gh_hinhanh text NOT NULL,
    gh_email character varying(100) NOT NULL,
    gh_hashpass text NOT NULL,
    ct_ma character varying(10) NOT NULL,
    dc_ma character varying(10),
    gh_danhgia double precision,
    gh_theodoi integer
);


ALTER TABLE public.gianhang OWNER TO postgres;

--
-- Name: hinhanhsanpham; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hinhanhsanpham (
    hasp_ma character varying(10) NOT NULL,
    hasp_link text NOT NULL,
    hasp_laanhchinh boolean DEFAULT false NOT NULL,
    hasp_thutu smallint DEFAULT 1 NOT NULL,
    ctsp_ma character varying(10) NOT NULL,
    hasp_mota text
);


ALTER TABLE public.hinhanhsanpham OWNER TO postgres;

--
-- Name: magiamgia_shop; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.magiamgia_shop (
    mgg_shop_ma character varying(10) NOT NULL,
    mgg_shop_ten character varying(50),
    mgg_shop_mota text,
    mgg_shop_hinhanh text,
    mgg_shop_trangthai boolean,
    mgg_shop_thoidiembatdau timestamp without time zone,
    mgg_shop_thoidiemketthuc timestamp without time zone,
    mgg_shop_giatridontoithieu numeric(15,2),
    mgg_shop_soluongconlai integer,
    mgg_shop_phantramgiam numeric(5,2),
    gh_ma character varying(10) NOT NULL,
    mgg_shop_soluongbandau integer,
    mgg_shop_sotiengiamtoidamoilan numeric(15,2)
);


ALTER TABLE public.magiamgia_shop OWNER TO postgres;

--
-- Name: magiamgia_vanchuyen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.magiamgia_vanchuyen (
    mgg_vc_ma character varying(10) NOT NULL,
    mgg_vc_ten character varying(50),
    mgg_vc_mota text,
    mgg_vc_hinhanh text,
    mgg_vc_trangthai boolean,
    mgg_vc_thoidiembatdau timestamp without time zone,
    mgg_vc_thoidiemketthuc timestamp without time zone,
    mgg_vc_giatridontoithieu numeric(15,2),
    mgg_vc_soluongconlai integer,
    mgg_vc_phantramgiam numeric(5,2),
    stmdt_ma character varying(10) NOT NULL,
    mgg_vc_soluongbandau integer,
    mgg_vc_sotiengiamtoidamoilan numeric(15,2)
);


ALTER TABLE public.magiamgia_vanchuyen OWNER TO postgres;

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
-- Name: thongtinnhanhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongtinnhanhang (
    ttnh_ma character varying(10) NOT NULL,
    dc_ma character varying(10) NOT NULL,
    kh_ma character varying(10) NOT NULL,
    ttnh_ten character varying(50) NOT NULL,
    ttnh_sdt character varying(15) NOT NULL,
    ttnh_ghichu text,
    ttnh_diachisnapshot text NOT NULL,
    ttnh_lamacdinh boolean DEFAULT false NOT NULL
);


ALTER TABLE public.thongtinnhanhang OWNER TO postgres;

--
-- Name: trangthaidonhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trangthaidonhang (
    ttdh_ma character varying(10) NOT NULL,
    ttdh_ten character varying(50) NOT NULL
);


ALTER TABLE public.trangthaidonhang OWNER TO postgres;

--
-- Name: chitiet_tat_toan chitiet_tat_toan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiet_tat_toan
    ADD CONSTRAINT chitiet_tat_toan_pkey PRIMARY KEY (ptt_ma, dts_ma);


--
-- Name: chitietdonhang chitietdonhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitietdonhang
    ADD CONSTRAINT chitietdonhang_pkey PRIMARY KEY (dts_ma, ctsp_ma);


--
-- Name: chitietgiohang chitietgiohang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitietgiohang
    ADD CONSTRAINT chitietgiohang_pkey PRIMARY KEY (kh_ma, ctsp_ma);


--
-- Name: chitietsanpham chitietsanpham_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitietsanpham
    ADD CONSTRAINT chitietsanpham_pkey PRIMARY KEY (ctsp_ma);


--
-- Name: chitiettrangthaidonhang chitiettrangthaidonhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiettrangthaidonhang
    ADD CONSTRAINT chitiettrangthaidonhang_pkey PRIMARY KEY (dts_ma, ttdh_ma, ctttdh_thoidiem);


--
-- Name: donhangkhachmua donhangkhachmua_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donhangkhachmua
    ADD CONSTRAINT donhangkhachmua_pkey PRIMARY KEY (dm_ma);


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
-- Name: gianhang gianhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gianhang
    ADD CONSTRAINT gianhang_pkey PRIMARY KEY (gh_ma);


--
-- Name: hinhanhsanpham hinhanhsanpham_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hinhanhsanpham
    ADD CONSTRAINT hinhanhsanpham_pkey PRIMARY KEY (hasp_ma);


--
-- Name: magiamgia_shop magiamgia_shop_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.magiamgia_shop
    ADD CONSTRAINT magiamgia_shop_pkey PRIMARY KEY (mgg_shop_ma);


--
-- Name: magiamgia_vanchuyen magiamgia_vanchuyen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.magiamgia_vanchuyen
    ADD CONSTRAINT magiamgia_vanchuyen_pkey PRIMARY KEY (mgg_vc_ma);


--
-- Name: phieu_tat_toan phieu_tat_toan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_tat_toan
    ADD CONSTRAINT phieu_tat_toan_pkey PRIMARY KEY (ptt_ma);


--
-- Name: thongtinnhanhang thongtinnhanhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhanhang
    ADD CONSTRAINT thongtinnhanhang_pkey PRIMARY KEY (ttnh_ma);


--
-- Name: trangthaidonhang trangthaidonhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trangthaidonhang
    ADD CONSTRAINT trangthaidonhang_pkey PRIMARY KEY (ttdh_ma);


--
-- Name: chitietdonhang chitietdonhang_ctsp_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitietdonhang
    ADD CONSTRAINT chitietdonhang_ctsp_ma_fkey FOREIGN KEY (ctsp_ma) REFERENCES public.chitietsanpham(ctsp_ma);


--
-- Name: chitietdonhang chitietdonhang_dts_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitietdonhang
    ADD CONSTRAINT chitietdonhang_dts_ma_fkey FOREIGN KEY (dts_ma) REFERENCES public.donhangtheoshop(dts_ma) ON DELETE CASCADE;


--
-- Name: chitietgiohang chitietgiohang_ctsp_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitietgiohang
    ADD CONSTRAINT chitietgiohang_ctsp_ma_fkey FOREIGN KEY (ctsp_ma) REFERENCES public.chitietsanpham(ctsp_ma) ON DELETE CASCADE;


--
-- Name: chitietgiohang chitietgiohang_kh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitietgiohang
    ADD CONSTRAINT chitietgiohang_kh_ma_fkey FOREIGN KEY (kh_ma) REFERENCES public.khachhang(kh_ma) ON DELETE CASCADE;


--
-- Name: chitietsanpham chitietsanpham_nh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitietsanpham
    ADD CONSTRAINT chitietsanpham_nh_ma_fkey FOREIGN KEY (nh_ma) REFERENCES public.nganhhang(nh_ma);


--
-- Name: chitietsanpham chitietsanpham_sp_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitietsanpham
    ADD CONSTRAINT chitietsanpham_sp_ma_fkey FOREIGN KEY (sp_ma) REFERENCES public.sanpham(sp_ma) ON DELETE CASCADE;


--
-- Name: chitiettrangthaidonhang chitiettrangthaidonhang_dts_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiettrangthaidonhang
    ADD CONSTRAINT chitiettrangthaidonhang_dts_ma_fkey FOREIGN KEY (dts_ma) REFERENCES public.donhangtheoshop(dts_ma) ON DELETE CASCADE;


--
-- Name: chitiettrangthaidonhang chitiettrangthaidonhang_ttdh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiettrangthaidonhang
    ADD CONSTRAINT chitiettrangthaidonhang_ttdh_ma_fkey FOREIGN KEY (ttdh_ma) REFERENCES public.trangthaidonhang(ttdh_ma);


--
-- Name: hinhanhsanpham ctsp_ma; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hinhanhsanpham
    ADD CONSTRAINT ctsp_ma FOREIGN KEY (ctsp_ma) REFERENCES public.chitietsanpham(ctsp_ma) ON DELETE CASCADE;


--
-- Name: donhangkhachmua donhangkhachmua_kh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donhangkhachmua
    ADD CONSTRAINT donhangkhachmua_kh_ma_fkey FOREIGN KEY (kh_ma) REFERENCES public.khachhang(kh_ma);


--
-- Name: donhangkhachmua donhangkhachmua_ttnh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donhangkhachmua
    ADD CONSTRAINT donhangkhachmua_ttnh_ma_fkey FOREIGN KEY (ttnh_ma) REFERENCES public.thongtinnhanhang(ttnh_ma);


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
-- Name: gianhang gianhang_ct_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gianhang
    ADD CONSTRAINT gianhang_ct_ma_fkey FOREIGN KEY (ct_ma) REFERENCES public.chuthe(ct_ma);


--
-- Name: gianhang gianhang_dc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gianhang
    ADD CONSTRAINT gianhang_dc_ma_fkey FOREIGN KEY (dc_ma) REFERENCES public.diachi(dc_ma);


--
-- Name: hinhanhsanpham hinhanhsanpham_ctsp_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hinhanhsanpham
    ADD CONSTRAINT hinhanhsanpham_ctsp_ma_fkey FOREIGN KEY (ctsp_ma) REFERENCES public.chitietsanpham(ctsp_ma);


--
-- Name: magiamgia_shop magiamgia_shop_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.magiamgia_shop
    ADD CONSTRAINT magiamgia_shop_ma_fkey FOREIGN KEY (gh_ma) REFERENCES public.gianhang(gh_ma);


--
-- Name: magiamgia_vanchuyen magiamgia_vanchuyen_stmdt_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.magiamgia_vanchuyen
    ADD CONSTRAINT magiamgia_vanchuyen_stmdt_ma_fkey FOREIGN KEY (stmdt_ma) REFERENCES public.san_thuong_mai_dien_tu(stmdt_ma);


--
-- Name: thongtinnhanhang thongtinnhanhang_dc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhanhang
    ADD CONSTRAINT thongtinnhanhang_dc_ma_fkey FOREIGN KEY (dc_ma) REFERENCES public.diachi(dc_ma);


--
-- Name: thongtinnhanhang thongtinnhanhang_kh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhanhang
    ADD CONSTRAINT thongtinnhanhang_kh_ma_fkey FOREIGN KEY (kh_ma) REFERENCES public.khachhang(kh_ma);


--
-- PostgreSQL database dump complete
--

\unrestrict X4OjCzRIH7dnDIB55Ovn6Mk6SvAdUBJQcA8pLAb7E8i9h8T79pLTdiyHfqgkhjz

