--
-- PostgreSQL database dump
--

\restrict aiT5aDrV8fxieXRGCgWY4jiRdC0CvsPuEyqcykrM6YNRKMB4SKGbOv7oANrHq8g

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

--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Name: chitietlichsutimkiem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chitietlichsutimkiem (
    kh_ma character varying(10) NOT NULL,
    ctsp_ma character varying(10) NOT NULL,
    ctlstk_thoidiem timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chitietlichsutimkiem OWNER TO postgres;

--
-- Name: chitietsanpham; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chitietsanpham (
    ctsp_ma character varying(10) NOT NULL,
    ctsp_ten character varying(50) NOT NULL,
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
-- Name: chitiettrangthaisanpham; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chitiettrangthaisanpham (
    stmdt_ma character varying(10) NOT NULL,
    ttctsp_ma character varying(10) NOT NULL,
    ctsp_ma character varying(10) NOT NULL,
    ctttsp_thoidiem timestamp with time zone NOT NULL,
    ctttsp_phanhoi text,
    ctttsp_yeucau text
);


ALTER TABLE public.chitiettrangthaisanpham OWNER TO postgres;

--
-- Name: chitiettrangthaisuco; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chitiettrangthaisuco (
    ycxlsc_ma character varying(10) NOT NULL,
    ttxlsc_ma character varying(10) NOT NULL,
    ctxlsc_thoidiem timestamp with time zone NOT NULL,
    ctxlsc_ghichu text
);


ALTER TABLE public.chitiettrangthaisuco OWNER TO postgres;

--
-- Name: chiutrachnhiemsuco; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chiutrachnhiemsuco (
    ct_ma_chiutrachnhiem character varying(10) NOT NULL,
    ycxlsc_ma character varying(10) NOT NULL
);


ALTER TABLE public.chiutrachnhiemsuco OWNER TO postgres;

--
-- Name: chuthe; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chuthe (
    ct_ma character varying(10) NOT NULL,
    ct_ten character varying(50) NOT NULL,
    ct_mota text NOT NULL
);


ALTER TABLE public.chuthe OWNER TO postgres;

--
-- Name: cuocphivanchuyen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cuocphivanchuyen (
    kvvc_ma character varying(10) NOT NULL,
    tvc_ma character varying(10) NOT NULL,
    klkh_ma character varying(10) NOT NULL,
    dvvc_ma character varying(10) NOT NULL,
    cpvc_thoidiem timestamp with time zone NOT NULL,
    cpvc_gia numeric(18,2) NOT NULL,
    CONSTRAINT cuocphivanchuyen_cpvc_gia_check CHECK ((cpvc_gia >= (0)::numeric))
);


ALTER TABLE public.cuocphivanchuyen OWNER TO postgres;

--
-- Name: danhgiasanpham; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.danhgiasanpham (
    kh_ma character varying(10) NOT NULL,
    ctsp_ma character varying(10) NOT NULL,
    dgsp_thoidiem timestamp with time zone DEFAULT now() NOT NULL,
    dgsp_sao smallint NOT NULL,
    dgsp_hinhanh text,
    dgsp_mota text,
    dgsp_phanhoi text,
    dts_ma character varying(10) NOT NULL,
    CONSTRAINT danhgiasanpham_dgsp_sao_check CHECK (((dgsp_sao >= 1) AND (dgsp_sao <= 5)))
);


ALTER TABLE public.danhgiasanpham OWNER TO postgres;

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
-- Name: diachi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diachi (
    dc_ma character varying(10) NOT NULL,
    dc_mota text NOT NULL,
    dc_gps text,
    xa_ma character varying(10) NOT NULL
);


ALTER TABLE public.diachi OWNER TO postgres;

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
    CONSTRAINT donhangtheoshop_dts_tienvanchuyen_check CHECK ((dts_tienvanchuyen >= (0)::numeric)),
    CONSTRAINT donhangtheoshop_dts_tongtiengiamgia_check CHECK ((dts_tongtiengiamgia >= (0)::numeric)),
    CONSTRAINT donhangtheoshop_dts_tongtienhang_check CHECK ((dts_tongtienhang >= (0)::numeric)),
    CONSTRAINT donhangtheoshop_dts_tongtienkhachhangthanhtoan_check CHECK ((dts_tongtienkhachhangthanhtoan >= (0)::numeric)),
    CONSTRAINT donhangtheoshop_dts_tongtienphisan_check CHECK ((dts_tongtienphisan >= (0)::numeric))
);


ALTER TABLE public.donhangtheoshop OWNER TO postgres;

--
-- Name: donvivanchuyen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donvivanchuyen (
    dvvc_ma character varying(10) NOT NULL,
    dvvc_ten character varying(50) NOT NULL,
    dvvc_hinhanh text NOT NULL,
    dvvc_email character varying(100) NOT NULL,
    dvvc_hashpass text NOT NULL,
    ct_ma character varying(10) NOT NULL,
    dvvc_mota text
);


ALTER TABLE public.donvivanchuyen OWNER TO postgres;

--
-- Name: dvvc_thongbao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dvvc_thongbao (
    tbdvvc_ma character varying(10) NOT NULL,
    tbdvvc_ten character varying(50) NOT NULL,
    tbdvvc_thoidiemtao timestamp with time zone DEFAULT now() NOT NULL,
    tbdvvc_mota text NOT NULL,
    tbdvvc_hinhanh text NOT NULL,
    tbdvvc_dadoc boolean DEFAULT false NOT NULL,
    tbdvvc_thoidiemdoc timestamp with time zone,
    dvvc_ma character varying(10) NOT NULL
);


ALTER TABLE public.dvvc_thongbao OWNER TO postgres;

--
-- Name: giabangoc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.giabangoc (
    gb_ma character varying(10) NOT NULL,
    gb_thoidiem timestamp with time zone NOT NULL,
    gb_gia numeric(18,2) NOT NULL,
    ctsp_ma character varying(10),
    CONSTRAINT giabangoc_gb_gia_check CHECK ((gb_gia >= (0)::numeric))
);


ALTER TABLE public.giabangoc OWNER TO postgres;

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
-- Name: gianhang_donvivanchuyen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gianhang_donvivanchuyen (
    gh_ma character varying(10) NOT NULL,
    dvvc_ma character varying(10) NOT NULL
);


ALTER TABLE public.gianhang_donvivanchuyen OWNER TO postgres;

--
-- Name: gianhang_kiennghi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gianhang_kiennghi (
    ghkn_ma character varying(10) NOT NULL,
    stmdt_ma character varying(10) NOT NULL,
    gh_ma character varying(10) NOT NULL,
    ghkn_thoidiemtao timestamp with time zone DEFAULT now() NOT NULL,
    ghkn_thoidiemphanhoi timestamp with time zone,
    ghkn_noidungkiennghi text NOT NULL,
    ghkn_noidungphanhoi text
);


ALTER TABLE public.gianhang_kiennghi OWNER TO postgres;

--
-- Name: giatrithuoctinh; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.giatrithuoctinh (
    ttsp_ma character varying(10) NOT NULL,
    gttt_giatridinhtinh text,
    gttt_giatridinhluong numeric(18,2),
    ctsp_ma character varying(10) NOT NULL
);


ALTER TABLE public.giatrithuoctinh OWNER TO postgres;

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
-- Name: hoantien; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hoantien (
    ht_ma character varying(10) NOT NULL,
    ht_sotienphatsinh numeric(18,2) NOT NULL,
    ht_sotiengoc numeric(18,2) NOT NULL,
    ht_thoidiem timestamp with time zone NOT NULL,
    ht_tongtienhoan numeric(18,2) NOT NULL,
    ycxlsc_ma character varying(10) NOT NULL,
    ct_tratien character varying(10) NOT NULL,
    ct_nhantien character varying(10) NOT NULL,
    CONSTRAINT chk_chuthekhacnhau CHECK (((ct_tratien)::text <> (ct_nhantien)::text)),
    CONSTRAINT chk_hoantien_tong CHECK ((ht_tongtienhoan <= (ht_sotiengoc + ht_sotienphatsinh))),
    CONSTRAINT hoantien_ht_sotiengoc_check CHECK ((ht_sotiengoc >= (0)::numeric)),
    CONSTRAINT hoantien_ht_sotienphatsinh_check CHECK ((ht_sotienphatsinh >= (0)::numeric)),
    CONSTRAINT hoantien_ht_tongtienhoan_check CHECK ((ht_tongtienhoan >= (0)::numeric))
);


ALTER TABLE public.hoantien OWNER TO postgres;

--
-- Name: khachhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.khachhang (
    kh_ma character varying(10) NOT NULL,
    kh_ten character varying(50) NOT NULL,
    kh_sdt character varying(15) NOT NULL,
    kh_ngaysinh date NOT NULL,
    kh_gioitinh boolean NOT NULL,
    kh_avatar text NOT NULL,
    kh_hashpass text NOT NULL,
    kh_email character varying(100),
    kh_ngaytao timestamp with time zone DEFAULT now() NOT NULL,
    ct_ma character varying(10) NOT NULL
);


ALTER TABLE public.khachhang OWNER TO postgres;

--
-- Name: khachhang_theodoi_shop; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.khachhang_theodoi_shop (
    kh_ma character varying(10) NOT NULL,
    gh_ma character varying(10) NOT NULL,
    td_thoidiem timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.khachhang_theodoi_shop OWNER TO postgres;

--
-- Name: kho; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kho (
    kho_ma character varying(10) NOT NULL,
    kho_ten character varying(50) NOT NULL,
    kho_hinhanh text NOT NULL,
    lk_ma character varying(10) NOT NULL,
    dc_ma character varying(10) NOT NULL,
    dvvc_ma character varying(10) NOT NULL
);


ALTER TABLE public.kho OWNER TO postgres;

--
-- Name: khoiluongkienhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.khoiluongkienhang (
    klkh_ma character varying(10) NOT NULL,
    klkh_ten character varying(50) NOT NULL,
    klkh_mota text NOT NULL,
    klkh_trongluongmax numeric(6,2),
    klkh_trongluongmin numeric(6,2) NOT NULL,
    CONSTRAINT chk_klkh_trongluong CHECK ((klkh_trongluongmax >= klkh_trongluongmin)),
    CONSTRAINT khoiluongkienhang_klkh_trongluongmin_check CHECK ((klkh_trongluongmin >= (0)::numeric))
);


ALTER TABLE public.khoiluongkienhang OWNER TO postgres;

--
-- Name: khomggsan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.khomggsan (
    mgg_ma character varying(10) NOT NULL,
    kh_ma character varying(10) NOT NULL
);


ALTER TABLE public.khomggsan OWNER TO postgres;

--
-- Name: khomggshop; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.khomggshop (
    mgg_shop_ma character varying(10) NOT NULL,
    kh_ma character varying(10) NOT NULL
);


ALTER TABLE public.khomggshop OWNER TO postgres;

--
-- Name: khomggvanchuyen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.khomggvanchuyen (
    mgg_vc_ma character varying(10) NOT NULL,
    kh_ma character varying(10) NOT NULL
);


ALTER TABLE public.khomggvanchuyen OWNER TO postgres;

--
-- Name: khuvucvanchuyen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.khuvucvanchuyen (
    kvvc_ma character varying(10) NOT NULL,
    kvvc_ten character varying(50) NOT NULL
);


ALTER TABLE public.khuvucvanchuyen OWNER TO postgres;

--
-- Name: loaikho; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loaikho (
    lk_ma character varying(10) NOT NULL,
    lk_ten character varying(50) NOT NULL,
    lk_mota text NOT NULL
);


ALTER TABLE public.loaikho OWNER TO postgres;

--
-- Name: loaisuco; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loaisuco (
    lsc_ma character varying(10) NOT NULL,
    lsc_ten character varying(50) NOT NULL,
    lsc_mota text
);


ALTER TABLE public.loaisuco OWNER TO postgres;

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
-- Name: magiamgiasan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.magiamgiasan (
    mgg_san_ma character varying(10) NOT NULL,
    mgg_san_ten character varying(50),
    mgg_san_mota text,
    mgg_san_hinhanh text,
    mgg_san_trangthai boolean,
    mgg_san_thoidiembatdau timestamp without time zone,
    mgg_san_thoidiemketthuc timestamp without time zone,
    mgg_san_giatridontoithieu numeric(15,2),
    mgg_san_soluongconlai integer,
    mgg_san_phantramgiam numeric(5,2),
    stmdt_ma character varying(10) NOT NULL,
    mgg_san_soluongbandau integer,
    mgg_san_sotiengiamtoidamoilan numeric(15,2)
);


ALTER TABLE public.magiamgiasan OWNER TO postgres;

--
-- Name: mien; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mien (
    mien_ma character varying(10) NOT NULL,
    mien_ten character varying(50)
);


ALTER TABLE public.mien OWNER TO postgres;

--
-- Name: minhchungsuco; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.minhchungsuco (
    mcsc_ma character varying(10) NOT NULL,
    mcsc_ten character varying(50) NOT NULL,
    mcsc_mota text NOT NULL,
    mcsc_video text NOT NULL,
    mcsc_thoidiem timestamp with time zone DEFAULT now() NOT NULL,
    ycxlsc_ma character varying(10) NOT NULL
);


ALTER TABLE public.minhchungsuco OWNER TO postgres;

--
-- Name: nganhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nganhang (
    nhg_ma character varying(10) CONSTRAINT nganhang_nganhang_ma_not_null NOT NULL,
    nhg_ten character varying(50) CONSTRAINT nganhang_nganhang_ten_not_null NOT NULL,
    nhg_logo text
);


ALTER TABLE public.nganhang OWNER TO postgres;

--
-- Name: nganhhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nganhhang (
    nh_ma character varying(10) NOT NULL,
    nh_ten character varying(50) NOT NULL,
    nh_cha character varying(10),
    nh_mota text NOT NULL
);


ALTER TABLE public.nganhhang OWNER TO postgres;

--
-- Name: phisanchieckhau; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phisanchieckhau (
    nh_ma character varying(10) NOT NULL,
    psck_thoidiem timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    psck_phantram numeric(5,2) NOT NULL,
    stmdt_ma character varying(10) NOT NULL,
    CONSTRAINT phisanchieckhau_psck_phantram_check CHECK (((psck_phantram >= (0)::numeric) AND (psck_phantram <= (100)::numeric)))
);


ALTER TABLE public.phisanchieckhau OWNER TO postgres;

--
-- Name: phuongthucthanhtoan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phuongthucthanhtoan (
    pttt_ma character varying(10) NOT NULL,
    pttt_ten character varying(50) NOT NULL
);


ALTER TABLE public.phuongthucthanhtoan OWNER TO postgres;

--
-- Name: san_thuong_mai_dien_tu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.san_thuong_mai_dien_tu (
    stmdt_ma character varying(10) NOT NULL,
    stmdt_ten character varying(50) NOT NULL,
    stmdt_email character varying(100),
    stmdt_hashpass text NOT NULL,
    stmdt_sdt character varying(15),
    ct_ma character varying(10) NOT NULL
);


ALTER TABLE public.san_thuong_mai_dien_tu OWNER TO postgres;

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
-- Name: sanphamyeuthich; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sanphamyeuthich (
    kh_ma character varying(10) NOT NULL,
    ctsp_ma character varying(10) NOT NULL
);


ALTER TABLE public.sanphamyeuthich OWNER TO postgres;

--
-- Name: shipper; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipper (
    shipper_ma character varying(10) NOT NULL,
    shipper_ten character varying(50) NOT NULL,
    shipper_sdt character varying(15) NOT NULL,
    shipper_hinhanh text,
    shipper_gioitinh boolean NOT NULL,
    shipper_ngaysinh date NOT NULL,
    shipper_diemdanhgiatrungbinh numeric(3,2) DEFAULT 0,
    kho_ma character varying(10) NOT NULL,
    CONSTRAINT shipper_shipper_diemdanhgiatrungbinh_check CHECK (((shipper_diemdanhgiatrungbinh >= (0)::numeric) AND (shipper_diemdanhgiatrungbinh <= (5)::numeric)))
);


ALTER TABLE public.shipper OWNER TO postgres;

--
-- Name: thongbao_gianhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongbao_gianhang (
    tbhg_ma character varying(10) NOT NULL,
    tbhg_ten character varying(50) NOT NULL,
    tbhg_thoidiemtao timestamp with time zone DEFAULT now() NOT NULL,
    tbhg_mota text NOT NULL,
    tbhg_hinhanh text NOT NULL,
    tbhg_dadoc boolean DEFAULT false NOT NULL,
    tbhg_thoidiemdoc timestamp with time zone,
    gh_ma character varying(10) NOT NULL
);


ALTER TABLE public.thongbao_gianhang OWNER TO postgres;

--
-- Name: thongbao_khachhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongbao_khachhang (
    tbkh_ma character varying(10) NOT NULL,
    tbkh_thoidiemtao timestamp with time zone DEFAULT now() NOT NULL,
    tbkh_ten character varying(50) NOT NULL,
    tbkh_mota text NOT NULL,
    tbkh_hinhanh text NOT NULL,
    tbkh_dadoc boolean DEFAULT false NOT NULL,
    tbkh_thoidiemdoc timestamp with time zone,
    kh_ma character varying(10) NOT NULL
);


ALTER TABLE public.thongbao_khachhang OWNER TO postgres;

--
-- Name: thongbao_san; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongbao_san (
    tbs_ma character varying(10) NOT NULL,
    tbs_thoidiemtao timestamp with time zone DEFAULT now() NOT NULL,
    tbs_ten character varying(50) NOT NULL,
    tbs_mota text NOT NULL,
    tbs_hinhanh text NOT NULL,
    tbs_dadoc boolean DEFAULT false NOT NULL,
    tbs_thoidiemdoc timestamp with time zone,
    stmdt_ma character varying(10) NOT NULL
);


ALTER TABLE public.thongbao_san OWNER TO postgres;

--
-- Name: thongtingiaohang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongtingiaohang (
    dts_ma character varying(10) NOT NULL,
    ttgh_thoidiem timestamp with time zone NOT NULL,
    ttgh_hinhanh text NOT NULL,
    ttgh_ghichu text,
    shipper_ma character varying(10) NOT NULL
);


ALTER TABLE public.thongtingiaohang OWNER TO postgres;

--
-- Name: thongtinlayhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongtinlayhang (
    dts_ma character varying(10) NOT NULL,
    ttlh_thoidiem timestamp with time zone NOT NULL,
    ttlh_hinhanh text NOT NULL,
    ttlh_ghichu text,
    shipper_ma character varying(10) NOT NULL
);


ALTER TABLE public.thongtinlayhang OWNER TO postgres;

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
-- Name: thongtinnhantien_dvvc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongtinnhantien_dvvc (
    dvvc_ma character varying(10) NOT NULL,
    nganhang_ma character varying(10) NOT NULL,
    ttnt_dvvc_sotaikhoan character varying(14) NOT NULL
);


ALTER TABLE public.thongtinnhantien_dvvc OWNER TO postgres;

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
-- Name: thongtinnhantien_kh; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongtinnhantien_kh (
    kh_ma character varying(10) NOT NULL,
    nganhang_ma character varying(10) NOT NULL,
    ttnt_kh_sotaikhoan character varying(14) NOT NULL,
    ttnt_kh_tennguoinhan character varying(50)
);


ALTER TABLE public.thongtinnhantien_kh OWNER TO postgres;

--
-- Name: thongtinnhantien_stmdt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongtinnhantien_stmdt (
    stmdt_ma character varying(10) NOT NULL,
    nganhang_ma character varying(10) NOT NULL,
    ttnt_stmdt_sotaikhoan character varying(14) NOT NULL
);


ALTER TABLE public.thongtinnhantien_stmdt OWNER TO postgres;

--
-- Name: thongtinthanhtoan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongtinthanhtoan (
    dts_ma character varying(10) NOT NULL,
    tttt_thoidiem timestamp with time zone DEFAULT now() NOT NULL,
    tttt_noidung text NOT NULL,
    tttt_sotien numeric(18,2) NOT NULL,
    pttt_ma character varying(10) NOT NULL,
    CONSTRAINT thongtinthanhtoan_tttt_sotien_check CHECK ((tttt_sotien >= (0)::numeric))
);


ALTER TABLE public.thongtinthanhtoan OWNER TO postgres;

--
-- Name: thuoctinhsanpham; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thuoctinhsanpham (
    thsp_ma character varying(10) NOT NULL,
    thsp_ten character varying(50) NOT NULL,
    thsp_mota text NOT NULL,
    thsp_icon text
);


ALTER TABLE public.thuoctinhsanpham OWNER TO postgres;

--
-- Name: thuonghieu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thuonghieu (
    th_ma character varying(10) NOT NULL,
    th_ten character varying(50) NOT NULL,
    th_mota text NOT NULL,
    th_hinhanh text NOT NULL
);


ALTER TABLE public.thuonghieu OWNER TO postgres;

--
-- Name: tinhtp; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tinhtp (
    tinh_ma character varying(10) NOT NULL,
    tinh_ten character varying(50) NOT NULL,
    tinh_gps text,
    mien_ma character varying(10)
);


ALTER TABLE public.tinhtp OWNER TO postgres;

--
-- Name: trangthaichitietsanpham; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trangthaichitietsanpham (
    ttctsp_ma character varying(10) NOT NULL,
    ttctsp_ten character varying(50) NOT NULL,
    ttctsp_mota text NOT NULL
);


ALTER TABLE public.trangthaichitietsanpham OWNER TO postgres;

--
-- Name: trangthaidonhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trangthaidonhang (
    ttdh_ma character varying(10) NOT NULL,
    ttdh_ten character varying(50) NOT NULL,
    ttdh_mota text
);


ALTER TABLE public.trangthaidonhang OWNER TO postgres;

--
-- Name: trangthaixulysuco; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trangthaixulysuco (
    ttxlsc_ma character varying(10) NOT NULL,
    ttxlsc_ten character varying(50) NOT NULL,
    ttxlsc_mota text
);


ALTER TABLE public.trangthaixulysuco OWNER TO postgres;

--
-- Name: tuyenvanchuyen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tuyenvanchuyen (
    tvc_ma character varying(10) NOT NULL,
    tvc_ten character varying(50) NOT NULL
);


ALTER TABLE public.tuyenvanchuyen OWNER TO postgres;

--
-- Name: vitridonhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vitridonhang (
    kho_ma character varying(10) NOT NULL,
    dts_ma character varying(10) NOT NULL,
    vtdh_thoidiem timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vitridonhang OWNER TO postgres;

--
-- Name: xaphuong; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.xaphuong (
    xa_ma character varying(10) NOT NULL,
    xa_ten character varying(50) NOT NULL,
    xa_gps text,
    tinh_ma character varying(10),
    kvvc_ma character varying(10)
);


ALTER TABLE public.xaphuong OWNER TO postgres;

--
-- Name: yeucauxulysuco; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.yeucauxulysuco (
    ycxlsc_ma character varying(10) NOT NULL,
    ycxlsc_thoidiem timestamp with time zone NOT NULL,
    ycxlsc_ten character varying(50) NOT NULL,
    ycxlsc_denghi text NOT NULL,
    ycxlsc_mota text NOT NULL,
    lsc_ma character varying(10) NOT NULL,
    dts_ma character varying(10) NOT NULL,
    ct_ma_denghi character varying(10) NOT NULL
);


ALTER TABLE public.yeucauxulysuco OWNER TO postgres;

--
-- Data for Name: chitietdonhang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chitietdonhang (dts_ma, ctsp_ma, ctdh_soluong, ctdh_dongia, ctdh_thanhtien) FROM stdin;
\.


--
-- Data for Name: chitietgiohang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chitietgiohang (kh_ma, ctsp_ma, ctgh_soluong, ctgh_thoidiemthem) FROM stdin;
KH001	CTSP02	2	2026-10-29 19:24:56.946033+07
KH001	CTSP03	1	2026-10-29 19:38:04.44646+07
\.


--
-- Data for Name: chitietlichsutimkiem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chitietlichsutimkiem (kh_ma, ctsp_ma, ctlstk_thoidiem) FROM stdin;
\.


--
-- Data for Name: chitietsanpham; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chitietsanpham (ctsp_ma, ctsp_ten, ctsp_mota, ctsp_soluongton, ctsp_chieudai, ctsp_chieurong, ctsp_khoiluong, ctsp_ngaytao, ctsp_luotxem, ctsp_luotthich, ctsp_luotmua, sp_ma, nh_ma, ctsp_gianban) FROM stdin;
CTSP01	IPHONE 18 PRO	[giới thiệu chung] iphone 18 pro	15	10.00	10.00	0.50	2026-10-25 12:06:09.426783+07	14	0	0	SP01	NH_002	22000000.00
CTSP03	IPHONE 18 Pro Max (màu đen)	18 pro max màu đen rất đẹp	19	10.00	10.00	1.00	2026-10-25 16:32:48.475481+07	12	1	0	SP01	NH_002	35200000.00
CTSP02	 IPHONE 18 PRO MAX	iphone 18 pro max xịn nhất 2026	25	10.00	10.00	1.00	2026-10-25 12:14:07.446933+07	13	0	0	SP01	NH_002	33000000.00
\.


--
-- Data for Name: chitiettrangthaidonhang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chitiettrangthaidonhang (dts_ma, ttdh_ma, ctttdh_thoidiem, ctttdh_ghichu) FROM stdin;
\.


--
-- Data for Name: chitiettrangthaisanpham; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chitiettrangthaisanpham (stmdt_ma, ttctsp_ma, ctsp_ma, ctttsp_thoidiem, ctttsp_phanhoi, ctttsp_yeucau) FROM stdin;
ST00000001	TTCTSP0001	CTSP01	2026-10-25 14:59:14.002264+07	\N	Yêu cầu duyệt sản phẩm
ST00000001	TTCTSP0001	CTSP02	2026-10-25 14:59:16.939519+07	\N	Yêu cầu duyệt sản phẩm
ST00000001	TTCTSP0003	CTSP01	2026-10-25 15:05:52.720075+07	Thông tin sản phẩm vi phạm chính sách sàn.	\N
ST00000001	TTCTSP0002	CTSP02	2026-10-25 15:05:58.600959+07	Đã duyệt, sản phẩm được phép bán.	\N
ST00000001	TTCTSP0001	CTSP01	2026-10-25 15:06:53.851232+07	\N	Yêu cầu duyệt sản phẩm em đã chỉnh sửa
ST00000001	TTCTSP0002	CTSP01	2026-10-25 15:07:31.44184+07	Đã duyệt, sản phẩm được phép bán.	\N
ST00000001	TTCTSP0003	CTSP02	2026-10-25 15:17:13.865502+07	Sản phẩm vi phạm chính sách của sàn.	\N
ST00000001	TTCTSP0001	CTSP03	2026-10-25 16:32:53.483386+07	\N	Yêu cầu duyệt sản phẩm
ST00000001	TTCTSP0002	CTSP03	2026-10-25 16:33:19.213782+07	Đã kiểm duyệt, sản phẩm đạt tiêu chuẩn và được phép bán.	\N
ST00000001	TTCTSP0003	CTSP01	2026-10-28 21:20:33.065423+07	thích thì đình chỉ	\N
ST00000001	TTCTSP0001	CTSP01	2026-10-29 14:19:28.401055+07	\N	Yêu cầu duyệt sản phẩm
ST00000001	TTCTSP0001	CTSP02	2026-10-29 14:19:32.442838+07	\N	Yêu cầu duyệt sản phẩm
ST00000001	TTCTSP0002	CTSP01	2026-10-29 14:19:58.028022+07	Đã kiểm duyệt, sản phẩm đạt tiêu chuẩn và được phép bán.	\N
ST00000001	TTCTSP0002	CTSP02	2026-10-29 14:20:00.418236+07	Đã kiểm duyệt, sản phẩm đạt tiêu chuẩn và được phép bán.	\N
\.


--
-- Data for Name: chitiettrangthaisuco; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chitiettrangthaisuco (ycxlsc_ma, ttxlsc_ma, ctxlsc_thoidiem, ctxlsc_ghichu) FROM stdin;
\.


--
-- Data for Name: chiutrachnhiemsuco; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chiutrachnhiemsuco (ct_ma_chiutrachnhiem, ycxlsc_ma) FROM stdin;
\.


--
-- Data for Name: chuthe; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chuthe (ct_ma, ct_ten, ct_mota) FROM stdin;
CT01	Sàn thương mại điện tử	Quản lý sàn thương mại điện tử
CT02	Gian hàng	Quảng lý gian hàng
CT03	Đơn vị vận chuyển	Quản lý hoạt động vận chuyển
CT04	Khách hàng	Mua hàng trực tuyến
\.


--
-- Data for Name: cuocphivanchuyen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cuocphivanchuyen (kvvc_ma, tvc_ma, klkh_ma, dvvc_ma, cpvc_thoidiem, cpvc_gia) FROM stdin;
\.


--
-- Data for Name: danhgiasanpham; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.danhgiasanpham (kh_ma, ctsp_ma, dgsp_thoidiem, dgsp_sao, dgsp_hinhanh, dgsp_mota, dgsp_phanhoi, dts_ma) FROM stdin;
\.


--
-- Data for Name: danhmucsanpham; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.danhmucsanpham (dmsp_ma, dmsp_ten, dmsp_mota, dmsp_hinhanh, gh_ma) FROM stdin;
DMSP01	Iphone	điện thoại 	/uploads/categories/category-1792904490327.png	GH01
DMSP02	macbook	laptop áp pồ\r\n	/uploads/categories/category-1792904510899.png	GH01
\.


--
-- Data for Name: diachi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.diachi (dc_ma, dc_mota, dc_gps, xa_ma) FROM stdin;
DC32888269	kwbgabfabừabừhằ	\N	00745
DC29821322	đường 3/2	\N	14797
DC32888270	nhà nghỉ thạch sanh	\N	31420
\.


--
-- Data for Name: donhangkhachmua; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donhangkhachmua (dm_ma, dm_ngaylap, dm_tongtien, kh_ma, ttnh_ma) FROM stdin;
\.


--
-- Data for Name: donhangtheoshop; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donhangtheoshop (dts_ma, dts_ngaylap, dts_thoidiemdukiengiao, dts_ghichu, dts_tongtienhang, dts_tienvanchuyen, dts_tongtiengiamgia, dts_tongtienkhachhangthanhtoan, dts_tongtienphisan, dts_trangthaithanhtoan, dm_ma, gh_ma, mgg_shop_ma, mgg_ma, mgg_vc_ma, klkh_ma, dc_layhangma, dvvc_ma) FROM stdin;
\.


--
-- Data for Name: donvivanchuyen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donvivanchuyen (dvvc_ma, dvvc_ten, dvvc_hinhanh, dvvc_email, dvvc_hashpass, ct_ma, dvvc_mota) FROM stdin;
DVVC000001	ăđă	/uploads/dvvc/dvvc-1793155833724-614515013.png	muocb230376@student.ctu.edu.vn	$2b$10$M.Ej.gZEZ.3OTZjmdWjJ..75ZZUlgMeT5MoDzLT5b0gAT2YJpiOB6	CT03	ădăd
\.


--
-- Data for Name: dvvc_thongbao; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dvvc_thongbao (tbdvvc_ma, tbdvvc_ten, tbdvvc_thoidiemtao, tbdvvc_mota, tbdvvc_hinhanh, tbdvvc_dadoc, tbdvvc_thoidiemdoc, dvvc_ma) FROM stdin;
\.


--
-- Data for Name: giabangoc; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.giabangoc (gb_ma, gb_thoidiem, gb_gia, ctsp_ma) FROM stdin;
GBmgwz07g5	2026-10-25 12:06:09.426783+07	20000000.00	CTSP01
GByhbxw9lc	2026-10-25 12:14:07.446933+07	30000000.00	CTSP02
GBq6ju6yms	2026-10-25 16:32:48.475481+07	32000000.00	CTSP03
\.


--
-- Data for Name: gianhang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gianhang (gh_ma, gh_ten, gh_mota, gh_hinhanh, gh_email, gh_hashpass, ct_ma, dc_ma, gh_danhgia, gh_theodoi) FROM stdin;
GH01	Shốp áp pồ	chuyên bán các mặc hàng của áp pồ	/uploads/shops/shop-1792740682908.jpg	muocb230376@student.ctu.edu.vn	$2b$10$vmujCoCPPkJNovq0fYGXTuGIT5aS4QGT5u0wy4f68P1BBO1Dcfj92	CT02	DC29821322	0	1
\.


--
-- Data for Name: gianhang_donvivanchuyen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gianhang_donvivanchuyen (gh_ma, dvvc_ma) FROM stdin;
\.


--
-- Data for Name: gianhang_kiennghi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gianhang_kiennghi (ghkn_ma, stmdt_ma, gh_ma, ghkn_thoidiemtao, ghkn_thoidiemphanhoi, ghkn_noidungkiennghi, ghkn_noidungphanhoi) FROM stdin;
KN001	ST00000001	GH01	2026-10-28 14:37:31.924006+07	2026-10-28 14:38:22.198051+07	Kiến nghị thêm thuộc tính inch, vì đây là thuộc tính cơ bản của màn hình 	sẽ thêm trước 0h ngày 29/10/2026
\.


--
-- Data for Name: giatrithuoctinh; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.giatrithuoctinh (ttsp_ma, gttt_giatridinhtinh, gttt_giatridinhluong, ctsp_ma) FROM stdin;
THSP01	đỏ che ri	\N	CTSP01
THSP01	trắng bạc	\N	CTSP02
THSP01	Đen	\N	CTSP03
\.


--
-- Data for Name: hinhanhsanpham; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hinhanhsanpham (hasp_ma, hasp_link, hasp_laanhchinh, hasp_thutu, ctsp_ma, hasp_mota) FROM stdin;
HAkx1cggj7	/uploads/products/product-1792904769418-568.webp	t	1	CTSP01	màu đỏ che ri
HAl2rynuqo	/uploads/products/product-1792905247431-811.png	t	1	CTSP02	ảnh của màu trắng
HAck33vyh9	/uploads/products/product-1792920768425-680.png	t	1	CTSP03	mô tả của hình ảnh
\.


--
-- Data for Name: hoantien; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hoantien (ht_ma, ht_sotienphatsinh, ht_sotiengoc, ht_thoidiem, ht_tongtienhoan, ycxlsc_ma, ct_tratien, ct_nhantien) FROM stdin;
\.


--
-- Data for Name: khachhang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.khachhang (kh_ma, kh_ten, kh_sdt, kh_ngaysinh, kh_gioitinh, kh_avatar, kh_hashpass, kh_email, kh_ngaytao, ct_ma) FROM stdin;
KH001	Lưu Văn Mược	0798239093	2005-05-03	t	/uploads/avatars/avatar-1793278144093.png	$2b$10$xLN9IbFtP9xuGvM86KNQXeM2I.oqRDDnMZCM4CXdevb1lM1/8g.Hu	muocb230376@student.ctu.edu.vn	2026-10-29 18:29:52.037285+07	CT04
\.


--
-- Data for Name: khachhang_theodoi_shop; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.khachhang_theodoi_shop (kh_ma, gh_ma, td_thoidiem) FROM stdin;
KH001	GH01	2026-10-29 18:50:47.446853+07
\.


--
-- Data for Name: kho; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kho (kho_ma, kho_ten, kho_hinhanh, lk_ma, dc_ma, dvvc_ma) FROM stdin;
\.


--
-- Data for Name: khoiluongkienhang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.khoiluongkienhang (klkh_ma, klkh_ten, klkh_mota, klkh_trongluongmax, klkh_trongluongmin) FROM stdin;
\.


--
-- Data for Name: khomggsan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.khomggsan (mgg_ma, kh_ma) FROM stdin;
\.


--
-- Data for Name: khomggshop; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.khomggshop (mgg_shop_ma, kh_ma) FROM stdin;
\.


--
-- Data for Name: khomggvanchuyen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.khomggvanchuyen (mgg_vc_ma, kh_ma) FROM stdin;
\.


--
-- Data for Name: khuvucvanchuyen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.khuvucvanchuyen (kvvc_ma, kvvc_ten) FROM stdin;
KV01	Nội Thành
KV02	Ngoại thành
KV03	Đặc biệc
\.


--
-- Data for Name: loaikho; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.loaikho (lk_ma, lk_ten, lk_mota) FROM stdin;
\.


--
-- Data for Name: loaisuco; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.loaisuco (lsc_ma, lsc_ten, lsc_mota) FROM stdin;
\.


--
-- Data for Name: magiamgia_shop; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.magiamgia_shop (mgg_shop_ma, mgg_shop_ten, mgg_shop_mota, mgg_shop_hinhanh, mgg_shop_trangthai, mgg_shop_thoidiembatdau, mgg_shop_thoidiemketthuc, mgg_shop_giatridontoithieu, mgg_shop_soluongconlai, mgg_shop_phantramgiam, gh_ma, mgg_shop_soluongbandau, mgg_shop_sotiengiamtoidamoilan) FROM stdin;
SHOPI9YLSU	sề	éề	/uploads/vouchers/voucher-shop-1793159727951-137186548.png	f	2026-10-28 10:55:00	2026-10-28 14:59:00	27000.00	0	10.00	GH01	100	18000.00
\.


--
-- Data for Name: magiamgia_vanchuyen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.magiamgia_vanchuyen (mgg_vc_ma, mgg_vc_ten, mgg_vc_mota, mgg_vc_hinhanh, mgg_vc_trangthai, mgg_vc_thoidiembatdau, mgg_vc_thoidiemketthuc, mgg_vc_giatridontoithieu, mgg_vc_soluongconlai, mgg_vc_phantramgiam, stmdt_ma, mgg_vc_soluongbandau, mgg_vc_sotiengiamtoidamoilan) FROM stdin;
VCEQ2FHO2V	ưadwađưaăd	dsfvfdssdfdsf	/uploads/vouchers/voucher-vc-1793158631177-316536231.png	f	2026-10-28 10:36:00	2026-10-28 13:54:00	31000.00	1	20.00	ST00000001	100	20000.00
\.


--
-- Data for Name: magiamgiasan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.magiamgiasan (mgg_san_ma, mgg_san_ten, mgg_san_mota, mgg_san_hinhanh, mgg_san_trangthai, mgg_san_thoidiembatdau, mgg_san_thoidiemketthuc, mgg_san_giatridontoithieu, mgg_san_soluongconlai, mgg_san_phantramgiam, stmdt_ma, mgg_san_soluongbandau, mgg_san_sotiengiamtoidamoilan) FROM stdin;
VCHH8BZKY6	ưdăd	thfhthfth	/uploads/vouchers/voucher-1793169143393-289040824.png	f	2026-10-27 13:32:00	2026-10-28 13:48:00	2500000.00	15	10.00	ST00000001	100	27000.00
\.


--
-- Data for Name: mien; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mien (mien_ma, mien_ten) FROM stdin;
M01	Miền Bắc
M02	Miền Trung
M03	Miền Nam
\.


--
-- Data for Name: minhchungsuco; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.minhchungsuco (mcsc_ma, mcsc_ten, mcsc_mota, mcsc_video, mcsc_thoidiem, ycxlsc_ma) FROM stdin;
\.


--
-- Data for Name: nganhang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nganhang (nhg_ma, nhg_ten, nhg_logo) FROM stdin;
NHG01	MB	/uploads/logos/logo-1792577293558-531733299.png
NHG02	VietCombank	/uploads/logos/logo-1792577293558-531733297.jpg
NHG03	BIDV	/uploads/logos/logo-1792577293558-531733298.webp
NHG04	VP	/uploads/logos/Icon-VPBank.webp
\.


--
-- Data for Name: nganhhang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nganhhang (nh_ma, nh_ten, nh_cha, nh_mota) FROM stdin;
NH_001	Đồ điện tử	\N	Thiết bị điện tử
NH_002	Điện thoại	NH_001	Điện thoại di động\n
NH_003	Laptop	NH_001	Máy tính xác tay\n
\.


--
-- Data for Name: phisanchieckhau; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phisanchieckhau (nh_ma, psck_thoidiem, psck_phantram, stmdt_ma) FROM stdin;
NH_002	2026-10-25 11:58:20.998409+07	10.00	ST00000001
NH_003	2026-10-25 11:58:22.358685+07	15.00	ST00000001
\.


--
-- Data for Name: phuongthucthanhtoan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phuongthucthanhtoan (pttt_ma, pttt_ten) FROM stdin;
\.


--
-- Data for Name: san_thuong_mai_dien_tu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.san_thuong_mai_dien_tu (stmdt_ma, stmdt_ten, stmdt_email, stmdt_hashpass, stmdt_sdt, ct_ma) FROM stdin;
ST00000001	sàn sốp pi	muocb230376@student.ctu.edu.vn	$2b$10$svinOBRjjeywfphUzI7Hy.7x11JfWOQeJIQbcso9TObHBI8f8Q9jq	0798239093	CT01
\.


--
-- Data for Name: sanpham; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sanpham (sp_ma, sp_ten, sp_mota, sp_luotxem, sp_luotthich, sp_luotmua, sp_diemdanhgiatrungbinh, gh_ma, th_ma, dmsp_ma) FROM stdin;
SP01	Iphone 18	Các dòng iphone thế hệ 18	0	0	0	0.00	GH01	TH01	DMSP01
\.


--
-- Data for Name: sanphamyeuthich; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sanphamyeuthich (kh_ma, ctsp_ma) FROM stdin;
\.


--
-- Data for Name: shipper; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipper (shipper_ma, shipper_ten, shipper_sdt, shipper_hinhanh, shipper_gioitinh, shipper_ngaysinh, shipper_diemdanhgiatrungbinh, kho_ma) FROM stdin;
\.


--
-- Data for Name: thongbao_gianhang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thongbao_gianhang (tbhg_ma, tbhg_ten, tbhg_thoidiemtao, tbhg_mota, tbhg_hinhanh, tbhg_dadoc, tbhg_thoidiemdoc, gh_ma) FROM stdin;
\.


--
-- Data for Name: thongbao_khachhang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thongbao_khachhang (tbkh_ma, tbkh_thoidiemtao, tbkh_ten, tbkh_mota, tbkh_hinhanh, tbkh_dadoc, tbkh_thoidiemdoc, kh_ma) FROM stdin;
\.


--
-- Data for Name: thongbao_san; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thongbao_san (tbs_ma, tbs_thoidiemtao, tbs_ten, tbs_mota, tbs_hinhanh, tbs_dadoc, tbs_thoidiemdoc, stmdt_ma) FROM stdin;
\.


--
-- Data for Name: thongtingiaohang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thongtingiaohang (dts_ma, ttgh_thoidiem, ttgh_hinhanh, ttgh_ghichu, shipper_ma) FROM stdin;
\.


--
-- Data for Name: thongtinlayhang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thongtinlayhang (dts_ma, ttlh_thoidiem, ttlh_hinhanh, ttlh_ghichu, shipper_ma) FROM stdin;
\.


--
-- Data for Name: thongtinnhanhang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thongtinnhanhang (ttnh_ma, dc_ma, kh_ma, ttnh_ten, ttnh_sdt, ttnh_ghichu, ttnh_diachisnapshot, ttnh_lamacdinh) FROM stdin;
TTNH01	DC32888270	KH001	Lưu Văn Mược	0798239093	có cha mẹ em ở nhà thì đừng ghé	nhà nghỉ thạch sanh, Phụng Hiệp, Cần Thơ	t
\.


--
-- Data for Name: thongtinnhantien_dvvc; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thongtinnhantien_dvvc (dvvc_ma, nganhang_ma, ttnt_dvvc_sotaikhoan) FROM stdin;
\.


--
-- Data for Name: thongtinnhantien_gianhang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thongtinnhantien_gianhang (gh_ma, nh_ma, ttnt_gianhang_sotaikhoan, ttnt_gianhang_tentaikhoan) FROM stdin;
GH01	NHG01	9798239486486	NGUYEN VAN B
\.


--
-- Data for Name: thongtinnhantien_kh; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thongtinnhantien_kh (kh_ma, nganhang_ma, ttnt_kh_sotaikhoan, ttnt_kh_tennguoinhan) FROM stdin;
KH001	NHG02	0798239093	LUU VAN MUOC
\.


--
-- Data for Name: thongtinnhantien_stmdt; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thongtinnhantien_stmdt (stmdt_ma, nganhang_ma, ttnt_stmdt_sotaikhoan) FROM stdin;
\.


--
-- Data for Name: thongtinthanhtoan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thongtinthanhtoan (dts_ma, tttt_thoidiem, tttt_noidung, tttt_sotien, pttt_ma) FROM stdin;
\.


--
-- Data for Name: thuoctinhsanpham; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thuoctinhsanpham (thsp_ma, thsp_ten, thsp_mota, thsp_icon) FROM stdin;
THSP01	Màu sắc	Mùa sắc của sản phẩm	/uploads/attributes/attr-1792904362129-346454430.jpg
\.


--
-- Data for Name: thuonghieu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thuonghieu (th_ma, th_ten, th_mota, th_hinhanh) FROM stdin;
TH01	Apple	Thương hiệu apple	/uploads/brands/brand-1792904424845-889947125.jpg
\.


--
-- Data for Name: tinhtp; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tinhtp (tinh_ma, tinh_ten, tinh_gps, mien_ma) FROM stdin;
01	Hà Nội	\N	M01
04	Cao Bằng	\N	M01
08	Tuyên Quang	\N	M01
11	Điện Biên	\N	M01
12	Lai Châu	\N	M01
14	Sơn La	\N	M01
15	Lào Cai	\N	M01
19	Thái Nguyên	\N	M01
20	Lạng Sơn	\N	M01
22	Quảng Ninh	\N	M01
24	Bắc Ninh	\N	M01
25	Phú Thọ	\N	M01
31	Hải Phòng	\N	M01
33	Hưng Yên	\N	M01
37	Ninh Bình	\N	M02
38	Thanh Hóa	\N	M02
40	Nghệ An	\N	M02
42	Hà Tĩnh	\N	M02
44	Quảng Trị	\N	M02
46	Huế	\N	M02
48	Đà Nẵng	\N	M02
51	Quảng Ngãi	\N	M02
52	Gia Lai	\N	M02
56	Khánh Hòa	\N	M02
66	Đắk Lắk	\N	M02
68	Lâm Đồng	\N	M02
75	Đồng Nai	\N	M03
79	Hồ Chí Minh	\N	M03
80	Tây Ninh	\N	M03
82	Đồng Tháp	\N	M03
86	Vĩnh Long	\N	M03
91	An Giang	\N	M03
92	Cần Thơ	\N	M03
96	Cà Mau	\N	M03
\.


--
-- Data for Name: trangthaichitietsanpham; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trangthaichitietsanpham (ttctsp_ma, ttctsp_ten, ttctsp_mota) FROM stdin;
TTCTSP0001	Chờ duyệt	Trạng thái chờ được sàn duyệt sản phẩm
TTCTSP0002	Được phép bán	Trạng thái sản phẩm được phép bán
TTCTSP0003	Đình chỉ bán	Trạng thái sản phẩm bị đình chỉ bán
\.


--
-- Data for Name: trangthaidonhang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trangthaidonhang (ttdh_ma, ttdh_ten, ttdh_mota) FROM stdin;
\.


--
-- Data for Name: trangthaixulysuco; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trangthaixulysuco (ttxlsc_ma, ttxlsc_ten, ttxlsc_mota) FROM stdin;
\.


--
-- Data for Name: tuyenvanchuyen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tuyenvanchuyen (tvc_ma, tvc_ten) FROM stdin;
TVC01	Nội Miền
TVC02	Liên Miền
\.


--
-- Data for Name: vitridonhang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vitridonhang (kho_ma, dts_ma, vtdh_thoidiem) FROM stdin;
\.


--
-- Data for Name: xaphuong; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.xaphuong (xa_ma, xa_ten, xa_gps, tinh_ma, kvvc_ma) FROM stdin;
00004	Ba Đình	\N	01	KV02
00008	Ngọc Hà	\N	01	KV01
00025	Giảng Võ	\N	01	KV02
00070	Hoàn Kiếm	\N	01	KV01
00082	Cửa Nam	\N	01	KV01
00091	Phú Thượng	\N	01	KV03
00097	Hồng Hà	\N	01	KV01
00103	Tây Hồ	\N	01	KV01
00118	Bồ Đề	\N	01	KV01
00127	Việt Hưng	\N	01	KV01
00136	Phúc Lợi	\N	01	KV01
00145	Long Biên	\N	01	KV02
00160	Nghĩa Đô	\N	01	KV03
00166	Cầu Giấy	\N	01	KV02
00175	Yên Hòa	\N	01	KV03
00190	Ô Chợ Dừa	\N	01	KV01
00199	Láng	\N	01	KV02
00226	Văn Miếu - Quốc Tử Giám	\N	01	KV02
00229	Kim Liên	\N	01	KV03
00235	Đống Đa	\N	01	KV03
00256	Hai Bà Trưng	\N	01	KV02
00283	Vĩnh Tuy	\N	01	KV02
00292	Bạch Mai	\N	01	KV03
00301	Vĩnh Hưng	\N	01	KV03
00316	Định Công	\N	01	KV01
00322	Tương Mai	\N	01	KV01
00328	Lĩnh Nam	\N	01	KV01
00331	Hoàng Mai	\N	01	KV02
00337	Hoàng Liệt	\N	01	KV03
00340	Yên Sở	\N	01	KV03
00352	Phương Liệt	\N	01	KV02
00364	Khương Đình	\N	01	KV01
00367	Thanh Xuân	\N	01	KV01
00376	Sóc Sơn	\N	01	KV03
00382	Kim Anh	\N	01	KV01
00385	Xã Trung Giã	\N	01	KV03
00430	Đa Phúc	\N	01	KV02
00433	Nội Bài	\N	01	KV01
00454	Đông Anh	\N	01	KV03
00466	Phúc Thịnh	\N	01	KV01
00475	Thư Lâm	\N	01	KV03
00493	Thiên Lộc	\N	01	KV02
00508	Vĩnh Thanh	\N	01	KV02
00541	Phù Đổng	\N	01	KV01
00562	Thuận An	\N	01	KV03
00565	Gia Lâm	\N	01	KV02
00577	Bát Tràng	\N	01	KV03
00592	Từ Liêm	\N	01	KV01
00598	Thượng Cát	\N	01	KV01
00602	Đông Ngạc	\N	01	KV03
00611	Xuân Đỉnh	\N	01	KV01
00613	Tây Tựu	\N	01	KV01
00619	Phú Diễn	\N	01	KV02
00622	Xuân Phương	\N	01	KV03
00634	Tây Mỗ	\N	01	KV02
00637	Đại Mỗ	\N	01	KV02
00640	Thanh Trì	\N	01	KV03
00643	Thanh Liệt	\N	01	KV03
00664	Đại Thanh	\N	01	KV03
00679	Ngọc Hồi	\N	01	KV02
00685	Nam Phù	\N	01	KV03
04930	Yên Xuân	\N	01	KV02
08974	Quang Minh	\N	01	KV01
08980	Yên Lãng	\N	01	KV02
08995	Tiến Thắng	\N	01	KV03
09022	Mê Linh	\N	01	KV02
09552	Kiến Hưng	\N	01	KV03
09556	Hà Đông	\N	01	KV02
09562	Yên Nghĩa	\N	01	KV01
09568	Phú Lương	\N	01	KV01
09574	Sơn Tây	\N	01	KV03
09604	Tùng Thiện	\N	01	KV01
09616	Đoài Phương	\N	01	KV03
09619	Quảng Oai	\N	01	KV03
09634	Cổ Đô	\N	01	KV03
09661	Minh Châu	\N	01	KV02
09664	Vật Lại	\N	01	KV01
09676	Bất Bạt	\N	01	KV03
09694	Suối Hai	\N	01	KV01
09700	Ba Vì	\N	01	KV03
09706	Yên Bài	\N	01	KV02
09715	Phúc Thọ	\N	01	KV03
09739	Phúc Lộc	\N	01	KV01
09772	Hát Môn	\N	01	KV03
09784	Xã Đan Phượng	\N	01	KV03
09787	Liên Minh	\N	01	KV01
09817	Ô Diên	\N	01	KV03
09832	Hoài Đức	\N	01	KV03
09856	Dương Hòa	\N	01	KV03
09871	Sơn Đồng	\N	01	KV02
09877	An Khánh	\N	01	KV02
09886	Dương Nội	\N	01	KV01
09895	Quốc Oai	\N	01	KV01
09910	Kiều Phú	\N	01	KV02
09931	Xã Hưng Đạo	\N	01	KV03
09952	Phú Cát	\N	01	KV01
09955	Thạch Thất	\N	01	KV03
09982	Hạ Bằng	\N	01	KV03
09988	Hòa Lạc	\N	01	KV02
10003	Tây Phương	\N	01	KV01
10015	Chương Mỹ	\N	01	KV02
10030	Phú Nghĩa	\N	01	KV02
10045	Xuân Mai	\N	01	KV01
10072	Quảng Bị	\N	01	KV02
10081	Trần Phú	\N	01	KV01
10096	Hòa Phú	\N	01	KV01
10114	Thanh Oai	\N	01	KV01
10126	Bình Minh	\N	01	KV01
10144	Tam Hưng	\N	01	KV01
10180	Dân Hòa	\N	01	KV02
10183	Thường Tín	\N	01	KV01
10210	Hồng Vân	\N	01	KV01
10231	Thượng Phúc	\N	01	KV02
10237	Chương Dương	\N	01	KV03
10273	Phú Xuyên	\N	01	KV02
10279	Phượng Dực	\N	01	KV02
10330	Chuyên Mỹ	\N	01	KV01
10342	Đại Xuyên	\N	01	KV01
10354	Vân Đình	\N	01	KV03
10369	Ứng Thiên	\N	01	KV02
10402	Ứng Hòa	\N	01	KV03
10417	Hòa Xá	\N	01	KV02
10441	Mỹ Đức	\N	01	KV02
10459	Phúc Sơn	\N	01	KV02
10465	Hồng Sơn	\N	01	KV03
10489	Hương Sơn	\N	01	KV03
01273	Thục Phán	\N	04	KV02
01279	Nùng Trí Cao	\N	04	KV02
01288	Tân Giang	\N	04	KV02
01290	Bảo Lâm	\N	04	KV03
01294	Lý Bôn	\N	04	KV01
01297	Nam Quang	\N	04	KV03
01304	Quảng Lâm	\N	04	KV01
01318	Yên Thổ	\N	04	KV03
01321	Bảo Lạc	\N	04	KV02
01324	Cốc Pàng	\N	04	KV03
01327	Cô Ba	\N	04	KV02
01336	Khánh Xuân	\N	04	KV02
01339	Xuân Trường	\N	04	KV03
01351	Hưng Đạo	\N	04	KV02
01354	Huy Giáp	\N	04	KV01
01360	Sơn Lộ	\N	04	KV01
01363	Thông Nông	\N	04	KV01
01366	Cần Yên	\N	04	KV02
01387	Thanh Long	\N	04	KV02
01392	Trường Hà	\N	04	KV01
01393	Lũng Nặm	\N	04	KV01
01414	Tổng Cọt	\N	04	KV03
01438	Hà Quảng	\N	04	KV02
01447	Trà Lĩnh	\N	04	KV02
01456	Quang Hán	\N	04	KV02
01465	Quang Trung	\N	04	KV03
01477	Trùng Khánh	\N	04	KV01
01489	Đình Phong	\N	04	KV02
01501	Đàm Thủy	\N	04	KV03
01525	Đoài Dương	\N	04	KV01
01537	Lý Quốc	\N	04	KV02
01552	Quang Long	\N	04	KV01
01558	Hạ Lang	\N	04	KV01
01561	Vinh Quý	\N	04	KV01
01576	Quảng Uyên	\N	04	KV03
01594	Độc Lập	\N	04	KV01
01618	Hạnh Phúc	\N	04	KV02
01636	Bế Văn Đàn	\N	04	KV02
01648	Phục Hòa	\N	04	KV03
01654	Hòa An	\N	04	KV03
01660	Nam Tuấn	\N	04	KV01
01699	Nguyễn Huệ	\N	04	KV01
01708	Bạch Đằng	\N	04	KV02
01726	Nguyên Bình	\N	04	KV01
01729	Tĩnh Túc	\N	04	KV01
01738	Ca Thành	\N	04	KV01
01747	Minh Tâm	\N	04	KV02
01768	Phan Thanh	\N	04	KV01
01774	Tam Kim	\N	04	KV01
01777	Thành Công	\N	04	KV02
01786	Đông Khê	\N	04	KV01
01789	Canh Tân	\N	04	KV03
01792	Kim Đồng	\N	04	KV02
01795	Minh Khai	\N	04	KV03
01807	Thạch An	\N	04	KV01
01822	Đức Long	\N	04	KV02
00691	Hà Giang 2	\N	08	KV01
00694	Hà Giang 1	\N	08	KV02
00700	Ngọc Đường	\N	08	KV03
00706	Phú Linh	\N	08	KV02
00715	Lũng Cú	\N	08	KV01
00721	Đồng Văn	\N	08	KV02
00733	Sà Phìn	\N	08	KV01
00745	Phố Bảng	\N	08	KV02
00763	Lũng Phìn	\N	08	KV03
00769	Mèo Vạc	\N	08	KV01
00778	Sơn Vĩ	\N	08	KV01
00787	Sủng Máng	\N	08	KV02
00802	Khâu Vai	\N	08	KV01
00808	Tát Ngà	\N	08	KV02
00817	Niêm Sơn	\N	08	KV03
00820	Yên Minh	\N	08	KV03
00829	Thắng Mố	\N	08	KV01
00832	Bạch Đích	\N	08	KV03
00847	Mậu Duệ	\N	08	KV03
00859	Ngọc Long	\N	08	KV02
00865	Đường Thượng	\N	08	KV01
00871	Du Già	\N	08	KV02
00874	Quản Bạ	\N	08	KV02
00883	Cán Tỷ	\N	08	KV03
00889	Nghĩa Thuận	\N	08	KV03
00892	Tùng Vài	\N	08	KV01
00901	Lùng Tám	\N	08	KV03
00913	Vị Xuyên	\N	08	KV01
00919	Minh Tân	\N	08	KV03
00922	Thuận Hoà	\N	08	KV02
00925	Tùng Bá	\N	08	KV02
00928	Thanh Thủy	\N	08	KV01
00937	Lao Chải	\N	08	KV02
00952	Cao Bồ	\N	08	KV03
00958	Thượng Sơn	\N	08	KV01
00967	Việt Lâm	\N	08	KV03
00970	Linh Hồ	\N	08	KV01
00976	Bạch Ngọc	\N	08	KV03
00982	Minh Sơn	\N	08	KV03
00985	Giáp Trung	\N	08	KV01
00991	Bắc Mê	\N	08	KV01
00994	Minh Ngọc	\N	08	KV02
01006	Yên Cường	\N	08	KV01
01012	Đường Hồng	\N	08	KV01
01021	Hoàng Su Phì	\N	08	KV02
01024	Bản Máy	\N	08	KV02
01033	Thàng Tín	\N	08	KV01
01051	Tân Tiến	\N	08	KV01
01057	Pờ Ly Ngài	\N	08	KV03
01075	Nậm Dịch	\N	08	KV02
01084	Hồ Thầu	\N	08	KV03
01090	Thông Nguyên	\N	08	KV02
01096	Pà Vầy Sủ	\N	08	KV01
01108	Xín Mần	\N	08	KV02
01117	Trung Thịnh	\N	08	KV03
01141	Nấm Dẩn	\N	08	KV03
01144	Quảng Nguyên	\N	08	KV02
01147	Khuôn Lùng	\N	08	KV03
01153	Bắc Quang	\N	08	KV01
01156	Vĩnh Tuy	\N	08	KV01
01165	Đồng Tâm	\N	08	KV02
01171	Tân Quang	\N	08	KV03
01180	Bằng Hành	\N	08	KV01
01192	Liên Hiệp	\N	08	KV03
01201	Hùng An	\N	08	KV03
01216	Đồng Yên	\N	08	KV01
01225	Tiên Nguyên	\N	08	KV02
01234	Yên Thành	\N	08	KV03
01237	Quang Bình	\N	08	KV03
01243	Tân Trịnh	\N	08	KV03
01246	Bằng Lang	\N	08	KV01
01255	Xuân Giang	\N	08	KV03
01261	Tiên Yên	\N	08	KV01
02212	Nông Tiến	\N	08	KV01
02215	Minh Xuân	\N	08	KV01
02221	Nà Hang	\N	08	KV03
02239	Thượng Nông	\N	08	KV01
02245	Côn Lôn	\N	08	KV02
02248	Yên Hoa	\N	08	KV01
02260	Hồng Thái	\N	08	KV01
02266	Lâm Bình	\N	08	KV03
02269	Thượng Lâm	\N	08	KV02
02287	Chiêm Hoá	\N	08	KV01
02296	Bình An	\N	08	KV03
02302	Minh Quang	\N	08	KV02
02305	Trung Hà	\N	08	KV03
02308	Tân Mỹ	\N	08	KV02
02317	Yên Lập	\N	08	KV01
02320	Tân An	\N	08	KV03
02332	Kiên Đài	\N	08	KV01
02350	Kim Bình	\N	08	KV03
02353	Hoà An	\N	08	KV02
02359	Tri Phú	\N	08	KV01
02365	Yên Nguyên	\N	08	KV02
02374	Hàm Yên	\N	08	KV03
02380	Bạch Xa	\N	08	KV01
02392	Phù Lưu	\N	08	KV02
02398	Yên Phú	\N	08	KV02
02404	Bình Xa	\N	08	KV02
02407	Thái Sơn	\N	08	KV01
02419	Thái Hoà	\N	08	KV01
02425	Hùng Đức	\N	08	KV03
02434	Lực Hành	\N	08	KV02
02437	Kiến Thiết	\N	08	KV03
02449	Xuân Vân	\N	08	KV03
02455	Hùng Lợi	\N	08	KV02
02458	Trung Sơn	\N	08	KV01
02470	Tân Long	\N	08	KV02
02473	Yên Sơn	\N	08	KV01
02494	Thái Bình	\N	08	KV02
02509	Mỹ Lâm	\N	08	KV02
02512	An Tường	\N	08	KV01
02524	Bình Thuận	\N	08	KV01
02530	Nhữ Khê	\N	08	KV02
02536	Sơn Dương	\N	08	KV03
02545	Tân Trào	\N	08	KV03
02548	Bình Ca	\N	08	KV02
02554	Minh Thanh	\N	08	KV01
02572	Đông Thọ	\N	08	KV01
02578	Tân Thanh	\N	08	KV01
02608	Hồng Sơn	\N	08	KV03
02611	Phú Lương	\N	08	KV02
02620	Sơn Thuỷ	\N	08	KV02
02623	Trường Sinh	\N	08	KV03
03127	Điện Biên Phủ	\N	11	KV03
03151	Mường Lay	\N	11	KV02
03158	Sín Thầu	\N	11	KV02
03160	Mường Nhé	\N	11	KV03
03162	Nậm Kè	\N	11	KV02
03163	Mường Toong	\N	11	KV02
03164	Quảng Lâm	\N	11	KV02
03166	Mường Chà	\N	11	KV02
03169	Nà Hỳ	\N	11	KV02
03172	Na Sang	\N	11	KV02
03175	Chà Tở	\N	11	KV01
03176	Nà Bủng	\N	11	KV03
03181	Mường Tùng	\N	11	KV01
03193	Pa Ham	\N	11	KV01
03194	Nậm Nèn	\N	11	KV01
03199	Si Pa Phìn	\N	11	KV02
03202	Mường Pồn	\N	11	KV03
03203	Na Son	\N	11	KV03
03208	Xa Dung	\N	11	KV01
03214	Mường Luân	\N	11	KV02
03217	Tủa Chùa	\N	11	KV02
03220	Tủa Thàng	\N	11	KV01
03226	Sín Chải	\N	11	KV02
03241	Sính Phình	\N	11	KV03
03244	Sáng Nhè	\N	11	KV01
03253	Tuần Giáo	\N	11	KV02
03256	Mường Ảng	\N	11	KV01
03260	Pú Nhung	\N	11	KV02
03268	Mường Mùn	\N	11	KV01
03283	Chiềng Sinh	\N	11	KV01
03295	Quài Tở	\N	11	KV03
03301	Búng Lao	\N	11	KV02
03313	Mường Lạn	\N	11	KV01
03316	Nà Tấu	\N	11	KV03
03325	Mường Phăng	\N	11	KV03
03328	Thanh Nưa	\N	11	KV01
03334	Mường Thanh	\N	11	KV03
03349	Thanh Yên	\N	11	KV01
03352	Thanh An	\N	11	KV03
03356	Sam Mứn	\N	11	KV03
03358	Núa Ngam	\N	11	KV01
03368	Mường Nhà	\N	11	KV03
03370	Pu Nhi	\N	11	KV03
03382	Phình Giàng	\N	11	KV02
03385	Tìa Dình	\N	11	KV03
03388	Đoàn Kết	\N	12	KV03
03390	Bình Lư	\N	12	KV02
03394	Sin Suối Hồ	\N	12	KV02
03405	Tả Lèng	\N	12	KV01
03408	Tân Phong	\N	12	KV01
03424	Bản Bo	\N	12	KV01
03430	Khun Há	\N	12	KV03
03433	Bum Tở	\N	12	KV02
03434	Nậm Hàng	\N	12	KV02
03439	Thu Lũm	\N	12	KV01
03442	Pa Ủ	\N	12	KV02
03445	Mường Tè	\N	12	KV03
03451	Mù Cả	\N	12	KV01
03460	Hua Bum	\N	12	KV02
03463	Tà Tổng	\N	12	KV02
03466	Bum Nưa	\N	12	KV01
03472	Mường Mô	\N	12	KV02
03478	Sìn Hồ	\N	12	KV02
03487	Lê Lợi	\N	12	KV02
03503	Pa Tần	\N	12	KV03
03508	Hồng Thu	\N	12	KV03
03517	Nậm Tăm	\N	12	KV01
03529	Tủa Sín Chải	\N	12	KV03
03532	Pu Sam Cáp	\N	12	KV02
03538	Nậm Mạ	\N	12	KV01
03544	Nậm Cuổi	\N	12	KV01
03549	Phong Thổ	\N	12	KV01
03562	Sì Lở Lầu	\N	12	KV03
03571	Dào San	\N	12	KV02
03583	Khổng Lào	\N	12	KV02
03595	Than Uyên	\N	12	KV03
03598	Tân Uyên	\N	12	KV02
03601	Mường Khoa	\N	12	KV03
03613	Nậm Sỏ	\N	12	KV03
03616	Pắc Ta	\N	12	KV01
03618	Mường Than	\N	12	KV03
03637	Mường Kim	\N	12	KV03
03640	Khoen On	\N	12	KV02
03646	Tô Hiệu	\N	14	KV02
03664	Chiềng An	\N	14	KV01
03670	Chiềng Cơi	\N	14	KV03
03679	Chiềng Sinh	\N	14	KV03
03688	Mường Chiên	\N	14	KV01
03694	Mường Giôn	\N	14	KV02
03703	Quỳnh Nhai	\N	14	KV02
03712	Mường Sại	\N	14	KV02
03721	Thuận Châu	\N	14	KV01
03724	Bình Thuận	\N	14	KV02
03727	Mường É	\N	14	KV02
03754	Chiềng La	\N	14	KV01
03757	Mường Khiêng	\N	14	KV03
03760	Mường Bám	\N	14	KV02
03763	Long Hẹ	\N	14	KV01
03781	Co Mạ	\N	14	KV03
03784	Nậm Lầu	\N	14	KV02
03799	Muổi Nọi	\N	14	KV02
03808	Mường La	\N	14	KV02
03814	Chiềng Lao	\N	14	KV03
03820	Ngọc Chiến	\N	14	KV02
03847	Mường Bú	\N	14	KV02
03850	Chiềng Hoa	\N	14	KV03
03856	Bắc Yên	\N	14	KV02
03862	Xím Vàng	\N	14	KV01
03868	Tà Xùa	\N	14	KV03
03871	Pắc Ngà	\N	14	KV03
03880	Tạ Khoa	\N	14	KV03
03892	Chiềng Sại	\N	14	KV01
03901	Suối Tọ	\N	14	KV01
03907	Mường Cơi	\N	14	KV02
03910	Phù Yên	\N	14	KV02
03922	Gia Phù	\N	14	KV03
03943	Mường Bang	\N	14	KV02
03958	Tường Hạ	\N	14	KV02
03961	Kim Bon	\N	14	KV01
03970	Tân Phong	\N	14	KV01
03979	Mộc Sơn	\N	14	KV03
03980	Mộc Châu	\N	14	KV03
03982	Thảo Nguyên	\N	14	KV01
03985	Chiềng Sơn	\N	14	KV02
03997	Tân Yên	\N	14	KV01
04000	Đoàn Kết	\N	14	KV03
04006	Song Khủa	\N	14	KV01
04018	Tô Múa	\N	14	KV01
04033	Vân Sơn	\N	14	KV02
04045	Lóng Sập	\N	14	KV01
04048	Vân Hồ	\N	14	KV01
04057	Xuân Nha	\N	14	KV01
04075	Yên Châu	\N	14	KV01
04078	Chiềng Hặc	\N	14	KV03
04087	Yên Sơn	\N	14	KV03
04096	Lóng Phiêng	\N	14	KV02
04099	Phiêng Khoài	\N	14	KV03
04105	Mai Sơn	\N	14	KV03
04108	Chiềng Sung	\N	14	KV03
04117	Mường Chanh	\N	14	KV02
04123	Chiềng Mung	\N	14	KV02
04132	Chiềng Mai	\N	14	KV02
04136	Tà Hộc	\N	14	KV03
04144	Phiêng Cằm	\N	14	KV02
04159	Phiêng Pằn	\N	14	KV02
04168	Sông Mã	\N	14	KV01
04171	Bó Sinh	\N	14	KV02
04183	Mường Lầm	\N	14	KV02
04186	Nậm Ty	\N	14	KV03
04195	Chiềng Sơ	\N	14	KV01
04204	Chiềng Khoong	\N	14	KV03
04210	Huổi Một	\N	14	KV01
04219	Mường Hung	\N	14	KV01
04222	Chiềng Khương	\N	14	KV02
04228	Púng Bánh	\N	14	KV03
04231	Sốp Cộp	\N	14	KV03
04240	Mường Lèo	\N	14	KV03
04246	Mường Lạn	\N	14	KV03
02647	Lào Cai	\N	15	KV01
02671	Cam Đường	\N	15	KV02
02680	Hợp Thành	\N	15	KV03
02683	Bát Xát	\N	15	KV02
02686	A Mú Sung	\N	15	KV02
02695	Trịnh Tường	\N	15	KV01
02701	Y Tý	\N	15	KV01
02707	Dền Sáng	\N	15	KV02
02725	Bản Xèo	\N	15	KV03
02728	Mường Hum	\N	15	KV02
02746	Cốc San	\N	15	KV01
02752	Pha Long	\N	15	KV03
02761	Mường Khương	\N	15	KV02
02782	Cao Sơn	\N	15	KV03
02788	Bản Lầu	\N	15	KV01
02809	Si Ma Cai	\N	15	KV02
02824	Sín Chéng	\N	15	KV03
02839	Bắc Hà	\N	15	KV03
02842	Tả Củ Tỷ	\N	15	KV02
02848	Lùng Phình	\N	15	KV02
02869	Bản Liền	\N	15	KV01
02890	Bảo Nhai	\N	15	KV01
02896	Cốc Lầu	\N	15	KV01
02902	Phong Hải	\N	15	KV02
02905	Bảo Thắng	\N	15	KV03
02908	Tằng Loỏng	\N	15	KV03
02923	Gia Phú	\N	15	KV02
02926	Xuân Quang	\N	15	KV02
02947	Bảo Yên	\N	15	KV01
02953	Nghĩa Đô	\N	15	KV02
02962	Xuân Hòa	\N	15	KV03
02968	Thượng Hà	\N	15	KV02
02989	Bảo Hà	\N	15	KV02
02998	Phúc Khánh	\N	15	KV03
03004	Ngũ Chỉ Sơn	\N	15	KV03
03006	Sa Pa	\N	15	KV03
03013	Tả Phìn	\N	15	KV01
03037	Tả Van	\N	15	KV01
03043	Mường Bo	\N	15	KV02
03046	Bản Hồ	\N	15	KV02
03061	Võ Lao	\N	15	KV03
03076	Nậm Chày	\N	15	KV03
03082	Văn Bàn	\N	15	KV03
03085	Nậm Xé	\N	15	KV03
03091	Chiềng Ken	\N	15	KV01
03103	Khánh Yên	\N	15	KV03
03106	Dương Quỳ	\N	15	KV03
03121	Minh Lương	\N	15	KV03
04252	Yên Bái	\N	15	KV02
04273	Nam Cường	\N	15	KV01
04279	Văn Phú	\N	15	KV01
04288	Nghĩa Lộ	\N	15	KV01
04303	Lục Yên	\N	15	KV02
04309	Lâm Thượng	\N	15	KV01
04336	Tân Lĩnh	\N	15	KV01
04342	Khánh Hòa	\N	15	KV01
04345	Mường Lai	\N	15	KV02
04363	Phúc Lợi	\N	15	KV01
04375	Mậu A	\N	15	KV03
04381	Lâm Giang	\N	15	KV02
04387	Châu Quế	\N	15	KV02
04399	Đông Cuông	\N	15	KV03
04402	Phong Dụ Hạ	\N	15	KV02
04423	Phong Dụ Thượng	\N	15	KV02
04429	Tân Hợp	\N	15	KV01
04441	Xuân Ái	\N	15	KV01
04450	Mỏ Vàng	\N	15	KV03
04456	Mù Cang Chải	\N	15	KV01
04462	Nậm Có	\N	15	KV03
04465	Khao Mang	\N	15	KV01
04474	Lao Chải	\N	15	KV03
04489	Chế Tạo	\N	15	KV02
04492	Púng Luông	\N	15	KV03
04498	Trấn Yên	\N	15	KV02
04531	Quy Mông	\N	15	KV01
04537	Lương Thịnh	\N	15	KV03
04543	Âu Lâu	\N	15	KV02
04564	Việt Hồng	\N	15	KV02
04576	Hưng Khánh	\N	15	KV01
04585	Hạnh Phúc	\N	15	KV03
04603	Tà Xi Láng	\N	15	KV02
04606	Trạm Tấu	\N	15	KV01
04609	Phình Hồ	\N	15	KV01
04630	Tú Lệ	\N	15	KV02
04636	Gia Hội	\N	15	KV02
04651	Sơn Lương	\N	15	KV02
04660	Liên Sơn	\N	15	KV01
04663	Trung Tâm	\N	15	KV02
04672	Văn Chấn	\N	15	KV01
04681	Cầu Thia	\N	15	KV03
04693	Cát Thịnh	\N	15	KV03
04699	Chấn Thịnh	\N	15	KV02
04705	Thượng Bằng La	\N	15	KV01
04711	Nghĩa Tâm	\N	15	KV01
04714	Yên Bình	\N	15	KV01
04717	Thác Bà	\N	15	KV02
04726	Cảm Nhân	\N	15	KV03
04744	Yên Thành	\N	15	KV01
04750	Bảo Ái	\N	15	KV01
01840	Đức Xuân	\N	19	KV01
01843	Bắc Kạn	\N	19	KV02
01849	Phong Quang	\N	19	KV02
01864	Bằng Thành	\N	19	KV02
01879	Cao Minh	\N	19	KV02
01882	Nghiên Loan	\N	19	KV03
01894	Phúc Lộc	\N	19	KV03
01906	Ba Bể	\N	19	KV03
01912	Chợ Rã	\N	19	KV02
01921	Thượng Minh	\N	19	KV02
01933	Đồng Phúc	\N	19	KV03
01936	Nà Phặc	\N	19	KV01
01942	Bằng Vân	\N	19	KV01
01954	Ngân Sơn	\N	19	KV02
01957	Thượng Quan	\N	19	KV02
01960	Hiệp Lực	\N	19	KV03
01969	Phủ Thông	\N	19	KV02
01981	Vĩnh Thông	\N	19	KV01
02008	Cẩm Giàng	\N	19	KV01
02014	Bạch Thông	\N	19	KV01
02020	Chợ Đồn	\N	19	KV01
02026	Nam Cường	\N	19	KV02
02038	Quảng Bạch	\N	19	KV03
02044	Yên Thịnh	\N	19	KV01
02071	Nghĩa Tá	\N	19	KV02
02083	Yên Phong	\N	19	KV03
02086	Chợ Mới	\N	19	KV01
02101	Thanh Mai	\N	19	KV01
02104	Tân Kỳ	\N	19	KV03
02107	Thanh Thịnh	\N	19	KV02
02116	Yên Bình	\N	19	KV02
02143	Văn Lang	\N	19	KV02
02152	Cường Lợi	\N	19	KV01
02155	Na Rì	\N	19	KV03
02176	Trần Phú	\N	19	KV03
02185	Côn Minh	\N	19	KV01
02191	Xuân Dương	\N	19	KV01
05443	Phan Đình Phùng	\N	19	KV02
05455	Quyết Thắng	\N	19	KV03
05467	Gia Sàng	\N	19	KV02
05482	Quan Triều	\N	19	KV02
05488	Đại Phúc	\N	19	KV01
05500	Tích Lương	\N	19	KV03
05503	Tân Cương	\N	19	KV02
05518	Sông Công	\N	19	KV03
05528	Bách Quang	\N	19	KV01
05533	Bá Xuyên	\N	19	KV02
05542	Lam Vỹ	\N	19	KV02
05551	Kim Phượng	\N	19	KV02
05563	Phượng Tiến	\N	19	KV03
05569	Định Hóa	\N	19	KV02
05581	Trung Hội	\N	19	KV02
05587	Bình Yên	\N	19	KV02
05602	Phú Đình	\N	19	KV03
05605	Bình Thành	\N	19	KV03
05611	Phú Lương	\N	19	KV02
05620	Yên Trạch	\N	19	KV01
05632	Hợp Thành	\N	19	KV01
05641	Vô Tranh	\N	19	KV02
05662	Trại Cau	\N	19	KV01
05665	Văn Lăng	\N	19	KV03
05674	Quang Sơn	\N	19	KV03
05680	Văn Hán	\N	19	KV03
05692	Đồng Hỷ	\N	19	KV03
05707	Nam Hòa	\N	19	KV02
05710	Linh Sơn	\N	19	KV02
05716	Võ Nhai	\N	19	KV03
05719	Sảng Mộc	\N	19	KV02
05722	Nghinh Tường	\N	19	KV03
05725	Thần Sa	\N	19	KV03
05740	La Hiên	\N	19	KV01
05746	Tràng Xá	\N	19	KV01
05755	Dân Tiến	\N	19	KV03
05773	Phú Xuyên	\N	19	KV01
05776	Đức Lương	\N	19	KV03
05788	Phú Lạc	\N	19	KV03
05800	Phú Thịnh	\N	19	KV01
05809	An Khánh	\N	19	KV02
05818	La Bằng	\N	19	KV03
05830	Đại Từ	\N	19	KV03
05845	Vạn Phú	\N	19	KV02
05851	Quân Chu	\N	19	KV01
05857	Phúc Thuận	\N	19	KV01
05860	Phổ Yên	\N	19	KV02
05881	Thành Công	\N	19	KV02
05890	Vạn Xuân	\N	19	KV03
05899	Trung Thành	\N	19	KV01
05908	Phú Bình	\N	19	KV03
05917	Tân Khánh	\N	19	KV02
05923	Tân Thành	\N	19	KV02
05941	Điềm Thụy	\N	19	KV02
05953	Kha Sơn	\N	19	KV02
05977	Đông Kinh	\N	20	KV02
05983	Lương Văn Tri	\N	20	KV01
05986	Tam Thanh	\N	20	KV03
06001	Đoàn Kết	\N	20	KV01
06004	Quốc Khánh	\N	20	KV02
06019	Tân Tiến	\N	20	KV03
06037	Kháng Chiến	\N	20	KV02
06040	Thất Khê	\N	20	KV02
06046	Tràng Định	\N	20	KV02
06058	Quốc Việt	\N	20	KV01
06073	Hoa Thám	\N	20	KV01
06076	Quý Hòa	\N	20	KV01
06079	Hồng Phong	\N	20	KV02
06085	Thiện Hòa	\N	20	KV02
06091	Thiện Thuật	\N	20	KV02
06103	Thiện Long	\N	20	KV01
06112	Bình Gia	\N	20	KV03
06115	Tân Văn	\N	20	KV01
06124	Na Sầm	\N	20	KV01
06148	Thụy Hùng	\N	20	KV01
06151	Hội Hoan	\N	20	KV02
06154	Văn Lãng	\N	20	KV02
06172	Hoàng Văn Thụ	\N	20	KV03
06184	Đồng Đăng	\N	20	KV01
06187	Kỳ Lừa	\N	20	KV02
06196	Ba Sơn	\N	20	KV02
06211	Cao Lộc	\N	20	KV02
06220	Công Sơn	\N	20	KV03
06253	Văn Quan	\N	20	KV03
06280	Điềm He	\N	20	KV01
06286	Khánh Khê	\N	20	KV02
06298	Yên Phúc	\N	20	KV02
06313	Tri Lễ	\N	20	KV01
06316	Tân Đoàn	\N	20	KV03
06325	xã Bắc Sơn	\N	20	KV02
06337	Tân Tri	\N	20	KV03
06349	Hưng Vũ	\N	20	KV03
06364	Vũ Lễ	\N	20	KV03
06367	Vũ Lăng	\N	20	KV03
06376	Nhất Hòa	\N	20	KV02
06385	Hữu Lũng	\N	20	KV02
06391	Yên Bình	\N	20	KV01
06400	Hữu Liên	\N	20	KV02
06415	Vân Nham	\N	20	KV03
06427	Cai Kinh	\N	20	KV02
06436	Thiện Tân	\N	20	KV02
06445	Tân Thành	\N	20	KV03
06457	Tuấn Sơn	\N	20	KV02
06463	Chi Lăng	\N	20	KV03
06475	Bằng Mạc	\N	20	KV01
06481	Chiến Thắng	\N	20	KV02
06496	Nhân Lý	\N	20	KV01
06505	Vạn Linh	\N	20	KV02
06517	Quan Sơn	\N	20	KV01
06526	Na Dương	\N	20	KV01
06529	Lộc Bình	\N	20	KV02
06541	Mẫu Sơn	\N	20	KV02
06565	Khuất Xá	\N	20	KV01
06577	Thống Nhất	\N	20	KV01
06601	Lợi Bác	\N	20	KV03
06607	Xuân Dương	\N	20	KV02
06613	Đình Lập	\N	20	KV01
06616	Thái Bình	\N	20	KV03
06625	Kiên Mộc	\N	20	KV01
06637	Châu Sơn	\N	20	KV01
06652	Hà Tu	\N	22	KV03
06658	Cao Xanh	\N	22	KV01
06661	Việt Hưng	\N	22	KV03
06673	Bãi Cháy	\N	22	KV02
06676	Hà Lầm	\N	22	KV01
06685	Hồng Gai	\N	22	KV02
06688	Hạ Long	\N	22	KV02
06706	Tuần Châu	\N	22	KV01
06709	Móng Cái 2	\N	22	KV02
06712	Móng Cái 1	\N	22	KV01
06724	Hải Sơn	\N	22	KV02
06733	Hải Ninh	\N	22	KV02
06736	Móng Cái 3	\N	22	KV03
06757	Vĩnh Thực	\N	22	KV03
06760	Mông Dương	\N	22	KV03
06778	Quang Hanh	\N	22	KV02
06781	Cửa Ông	\N	22	KV03
06793	Cẩm Phả	\N	22	KV03
06799	Hải Hòa	\N	22	KV03
06811	Uông Bí	\N	22	KV01
06820	Vàng Danh	\N	22	KV02
06832	Yên Tử	\N	22	KV03
06838	Bình Liêu	\N	22	KV02
06841	Hoành Mô	\N	22	KV03
06856	Lục Hồn	\N	22	KV02
06862	Tiên Yên	\N	22	KV01
06874	Điền Xá	\N	22	KV03
06877	Đông Ngũ	\N	22	KV01
06886	Hải Lạng	\N	22	KV03
06895	Đầm Hà	\N	22	KV01
06913	Quảng Tân	\N	22	KV01
06922	Quảng Hà	\N	22	KV01
06931	Quảng Đức	\N	22	KV03
06946	Đường Hoa	\N	22	KV01
06967	Cái Chiên	\N	22	KV02
06970	Ba Chẽ	\N	22	KV01
06979	Kỳ Thượng	\N	22	KV01
06985	Lương Minh	\N	22	KV01
06994	Đặc khu Vân Đồn	\N	22	KV01
07030	Hoành Bồ	\N	22	KV03
07054	Quảng La	\N	22	KV02
07060	Thống Nhất	\N	22	KV02
07069	Mạo Khê	\N	22	KV02
07081	Bình Khê	\N	22	KV02
07090	An Sinh	\N	22	KV02
07093	Đông Triều	\N	22	KV01
07114	Hoàng Quế	\N	22	KV02
07132	Quảng Yên	\N	22	KV01
07135	Đông Mai	\N	22	KV03
07147	Hiệp Hòa	\N	22	KV02
07168	Hà An	\N	22	KV03
07180	Liên Hòa	\N	22	KV01
07183	Phong Cốc	\N	22	KV03
07192	Đặc khu Cô Tô	\N	22	KV02
07210	Bắc Giang	\N	24	KV02
07228	Đa Mai	\N	24	KV01
07246	Xuân Lương	\N	24	KV02
07264	Tam Tiến	\N	24	KV03
07282	Đồng Kỳ	\N	24	KV03
07288	Yên Thế	\N	24	KV01
07294	Bố Hạ	\N	24	KV02
07306	Nhã Nam	\N	24	KV01
07330	Phúc Hòa	\N	24	KV01
07333	Quang Trung	\N	24	KV01
07339	Tân Yên	\N	24	KV03
07351	Ngọc Thiện	\N	24	KV01
07375	Lạng Giang	\N	24	KV01
07381	Tiên Lục	\N	24	KV02
07399	Kép	\N	24	KV03
07420	Mỹ Thái	\N	24	KV03
07432	Tân Dĩnh	\N	24	KV02
07444	Lục Nam	\N	24	KV03
07450	Đông Phú	\N	24	KV03
07462	Bảo Đài	\N	24	KV02
07486	Nghĩa Phương	\N	24	KV03
07489	Trường Sơn	\N	24	KV02
07492	Lục Sơn	\N	24	KV02
07498	Bắc Lũng	\N	24	KV02
07519	Cẩm Lý	\N	24	KV03
07525	Chũ	\N	24	KV02
07531	Tân Sơn	\N	24	KV02
07534	Sa Lý	\N	24	KV02
07537	Biên Sơn	\N	24	KV01
07543	Sơn Hải	\N	24	KV01
07552	Kiên Lao	\N	24	KV03
07573	Biển Động	\N	24	KV01
07582	Lục Ngạn	\N	24	KV01
07594	Đèo Gia	\N	24	KV03
07603	Nam Dương	\N	24	KV03
07612	Phượng Sơn	\N	24	KV02
07615	Sơn Động	\N	24	KV02
07616	Tây Yên Tử	\N	24	KV03
07621	Vân Sơn	\N	24	KV01
07627	Đại Sơn	\N	24	KV01
07642	Yên Định	\N	24	KV01
07654	An Lạc	\N	24	KV01
07663	Tuấn Đạo	\N	24	KV03
07672	Dương Hưu	\N	24	KV03
07681	Yên Dũng	\N	24	KV02
07682	Tân An	\N	24	KV01
07696	Tiền Phong	\N	24	KV02
07699	Tân Tiến	\N	24	KV01
07735	Đồng Việt	\N	24	KV03
07738	Cảnh Thụy	\N	24	KV01
07774	Tự Lạn	\N	24	KV01
07777	Việt Yên	\N	24	KV03
07795	Nếnh	\N	24	KV01
07798	Vân Hà	\N	24	KV03
07822	Hoàng Vân	\N	24	KV03
07840	Hiệp Hoà	\N	24	KV01
07864	Hợp Thịnh	\N	24	KV01
07870	Xuân Cẩm	\N	24	KV03
09169	Vũ Ninh	\N	24	KV03
09187	Kinh Bắc	\N	24	KV01
09190	Võ Cường	\N	24	KV03
09193	Yên Phong	\N	24	KV03
09202	Tam Giang	\N	24	KV02
09205	Yên Trung	\N	24	KV01
09208	Tam Đa	\N	24	KV03
09238	Văn Môn	\N	24	KV01
09247	Quế Võ	\N	24	KV03
09253	Nhân Hòa	\N	24	KV03
09265	Phương Liễu	\N	24	KV03
09286	Nam Sơn	\N	24	KV01
09292	Phù Lãng	\N	24	KV03
09295	Bồng Lai	\N	24	KV02
09301	Đào Viên	\N	24	KV02
09313	Chi Lăng	\N	24	KV01
09319	Tiên Du	\N	24	KV02
09325	Hạp Lĩnh	\N	24	KV02
09334	Liên Bão	\N	24	KV01
09340	Đại Đồng	\N	24	KV03
09343	Tân Chi	\N	24	KV01
09349	Phật Tích	\N	24	KV01
09367	Từ Sơn	\N	24	KV03
09370	Tam Sơn	\N	24	KV02
09379	Phù Khê	\N	24	KV03
09385	Đồng Nguyên	\N	24	KV01
09400	Thuận Thành	\N	24	KV03
09409	Mão Điền	\N	24	KV01
09427	Trí Quả	\N	24	KV03
09430	Trạm Lộ	\N	24	KV01
09433	Song Liễu	\N	24	KV03
09445	Ninh Xá	\N	24	KV03
09454	Gia Bình	\N	24	KV03
09466	Cao Đức	\N	24	KV01
09469	Đại Lai	\N	24	KV01
09475	Nhân Thắng	\N	24	KV01
09487	Đông Cứu	\N	24	KV03
09496	Lương Tài	\N	24	KV02
09499	Trung Kênh	\N	24	KV02
09523	Trung Chính	\N	24	KV01
09529	Lâm Thao	\N	24	KV02
04792	Tân Hòa	\N	25	KV02
04795	Hòa Bình	\N	25	KV03
04828	Thống Nhất	\N	25	KV02
04831	Đà Bắc	\N	25	KV02
04846	Đức Nhàn	\N	25	KV01
04849	Tân Pheo	\N	25	KV01
04873	Quy Đức	\N	25	KV01
04876	Cao Sơn	\N	25	KV01
04891	Tiền Phong	\N	25	KV03
04894	Kỳ Sơn	\N	25	KV01
04897	Thịnh Minh	\N	25	KV01
04924	Lương Sơn	\N	25	KV02
04960	Liên Sơn	\N	25	KV01
04978	Kim Bôi	\N	25	KV03
04990	Nật Sơn	\N	25	KV01
05014	Mường Động	\N	25	KV03
05047	Cao Dương	\N	25	KV01
05068	Hợp Kim	\N	25	KV03
05086	Dũng Tiến	\N	25	KV02
05089	Cao Phong	\N	25	KV02
05092	Thung Nai	\N	25	KV02
05116	Mường Thàng	\N	25	KV02
05128	Tân Lạc	\N	25	KV03
05134	Mường Hoa	\N	25	KV03
05152	Vân Sơn	\N	25	KV01
05158	Mường Bi	\N	25	KV01
05191	Toàn Thắng	\N	25	KV02
05200	Mai Châu	\N	25	KV02
05206	Tân Mai	\N	25	KV03
05212	Pà Cò	\N	25	KV01
05245	Bao La	\N	25	KV02
05251	Mai Hạ	\N	25	KV03
05266	Lạc Sơn	\N	25	KV03
05287	Mường Vang	\N	25	KV02
05290	Nhân Nghĩa	\N	25	KV03
05293	Thượng Cốc	\N	25	KV02
05305	Yên Phú	\N	25	KV02
05323	Quyết Thắng	\N	25	KV03
05329	Ngọc Sơn	\N	25	KV02
05347	Đại Đồng	\N	25	KV01
05353	Yên Thủy	\N	25	KV02
05362	Lạc Lương	\N	25	KV02
05386	Yên Trị	\N	25	KV03
05392	Lạc Thủy	\N	25	KV03
05395	An Nghĩa	\N	25	KV02
05425	An Bình	\N	25	KV02
07894	Nông Trang	\N	25	KV03
07900	Việt Trì	\N	25	KV01
07909	Thanh Miếu	\N	25	KV03
07918	Vân Phú	\N	25	KV02
07942	Phú Thọ	\N	25	KV03
07948	Âu Cơ	\N	25	KV02
07954	Phong Châu	\N	25	KV02
07969	Đoan Hùng	\N	25	KV03
07996	Bằng Luân	\N	25	KV03
07999	Chí Đám	\N	25	KV01
08023	Tây Cốc	\N	25	KV01
08038	Chân Mộng	\N	25	KV03
08053	Hạ Hòa	\N	25	KV01
08071	Đan Thượng	\N	25	KV01
08110	Hiền Lương	\N	25	KV01
08113	Yên Kỳ	\N	25	KV02
08134	Văn Lang	\N	25	KV03
08143	Vĩnh Chân	\N	25	KV01
08152	Thanh Ba	\N	25	KV01
08173	Quảng Yên	\N	25	KV03
08203	Hoàng Cương	\N	25	KV03
08209	Đông Thành	\N	25	KV02
08218	Chí Tiên	\N	25	KV03
08227	Liên Minh	\N	25	KV02
08230	Phù Ninh	\N	25	KV01
08236	Phú Mỹ	\N	25	KV02
08245	Trạm Thản	\N	25	KV02
08254	Dân Chủ	\N	25	KV03
08275	Bình Phú	\N	25	KV01
08290	Yên Lập	\N	25	KV03
08296	Sơn Lương	\N	25	KV03
08305	Xuân Viên	\N	25	KV03
08311	Trung Sơn	\N	25	KV01
08323	Thượng Long	\N	25	KV02
08338	Minh Hòa	\N	25	KV02
08341	Cẩm Khê	\N	25	KV02
08344	Tiên Lương	\N	25	KV03
08377	Vân Bán	\N	25	KV02
08398	Phú Khê	\N	25	KV02
08416	Hùng Việt	\N	25	KV01
08431	Đồng Lương	\N	25	KV02
08434	Tam Nông	\N	25	KV01
08443	Hiền Quan	\N	25	KV03
08467	Vạn Xuân	\N	25	KV02
08479	Thọ Văn	\N	25	KV01
08494	Lâm Thao	\N	25	KV01
08500	Xuân Lũng	\N	25	KV02
08515	Hy Cương	\N	25	KV01
08521	Phùng Nguyên	\N	25	KV02
08527	Bản Nguyên	\N	25	KV03
08542	Thanh Sơn	\N	25	KV02
08545	Thu Cúc	\N	25	KV01
08560	Lai Đồng	\N	25	KV01
08566	Tân Sơn	\N	25	KV03
08584	Võ Miếu	\N	25	KV01
08590	Xuân Đài	\N	25	KV03
08593	Minh Đài	\N	25	KV01
08611	Văn Miếu	\N	25	KV01
08614	Cự Đồng	\N	25	KV03
08620	Long Cốc	\N	25	KV02
08632	Hương Cần	\N	25	KV01
08635	Khả Cửu	\N	25	KV02
08656	Yên Sơn	\N	25	KV03
08662	Đào Xá	\N	25	KV03
08674	Thanh Thủy	\N	25	KV03
08686	Tu Vũ	\N	25	KV01
08707	Vĩnh Yên	\N	25	KV02
08716	Vĩnh Phúc	\N	25	KV02
08740	Phúc Yên	\N	25	KV01
08746	Xuân Hòa	\N	25	KV03
08761	Lập Thạch	\N	25	KV03
08770	Hợp Lý	\N	25	KV02
08773	Yên Lãng	\N	25	KV01
08782	Hải Lựu	\N	25	KV02
08788	Thái Hòa	\N	25	KV01
08812	Liên Hòa	\N	25	KV01
08824	Tam Sơn	\N	25	KV03
08842	Tiên Lữ	\N	25	KV02
08848	Sông Lô	\N	25	KV01
08866	Sơn Đông	\N	25	KV03
08869	Tam Dương	\N	25	KV03
08872	Tam Dương Bắc	\N	25	KV01
08896	Hoàng An	\N	25	KV03
08905	Hội Thịnh	\N	25	KV03
08911	Tam Đảo	\N	25	KV02
08914	Đạo Trù	\N	25	KV03
08923	Đại Đình	\N	25	KV03
08935	Bình Nguyên	\N	25	KV02
08944	Bình Tuyền	\N	25	KV02
08950	Bình Xuyên	\N	25	KV03
08971	Xuân Lãng	\N	25	KV03
09025	Yên Lạc	\N	25	KV02
09040	Tề Lỗ	\N	25	KV03
09043	Tam Hồng	\N	25	KV03
09052	Nguyệt Đức	\N	25	KV01
09064	Liên Châu	\N	25	KV03
09076	Vĩnh Tường	\N	25	KV02
09079	Vĩnh An	\N	25	KV03
09100	Vĩnh Hưng	\N	25	KV03
09106	Vĩnh Thành	\N	25	KV03
09112	Thổ Tang	\N	25	KV01
09154	Vĩnh Phú	\N	25	KV02
10507	Thành Đông	\N	31	KV02
10525	Hải Dương	\N	31	KV01
10532	Lê Thanh Nghị	\N	31	KV03
10537	Tân Hưng	\N	31	KV02
10543	Việt Hòa	\N	31	KV03
10546	Chí Linh	\N	31	KV01
10549	Chu Văn An	\N	31	KV03
10552	Nguyễn Trãi	\N	31	KV03
10570	Trần Hưng Đạo	\N	31	KV03
10573	Trần Nhân Tông	\N	31	KV01
10603	Lê Đại Hành	\N	31	KV02
10606	Nam Sách	\N	31	KV03
10615	Hợp Tiến	\N	31	KV01
10633	Trần Phú	\N	31	KV01
10642	Thái Tân	\N	31	KV01
10645	An Phú	\N	31	KV02
10660	Ái Quốc	\N	31	KV01
10675	Kinh Môn	\N	31	KV03
10678	Bắc An Phụ	\N	31	KV01
10705	Nam An Phụ	\N	31	KV03
10714	Nhị Chiểu	\N	31	KV03
10726	Phạm Sư Mạnh	\N	31	KV02
10729	Trần Liễu	\N	31	KV03
10744	Nguyễn Đại Năng	\N	31	KV02
10750	Phú Thái	\N	31	KV03
10756	Lai Khê	\N	31	KV01
10792	An Thành	\N	31	KV01
10804	Kim Thành	\N	31	KV02
10813	Thanh Hà	\N	31	KV01
10816	Hà Bắc	\N	31	KV01
10837	Nam Đồng	\N	31	KV02
10843	Hà Nam	\N	31	KV03
10846	Hà Tây	\N	31	KV03
10882	Hà Đông	\N	31	KV02
10888	Cẩm Giang	\N	31	KV02
10891	Tứ Minh	\N	31	KV02
10903	Cẩm Giàng	\N	31	KV02
10909	Tuệ Tĩnh	\N	31	KV01
10930	Mao Điền	\N	31	KV03
10945	Kẻ Sặt	\N	31	KV03
10966	Bình Giang	\N	31	KV02
10972	Đường An	\N	31	KV03
10993	Thượng Hồng	\N	31	KV01
10999	Gia Lộc	\N	31	KV02
11002	Thạch Khôi	\N	31	KV01
11020	Yết Kiêu	\N	31	KV02
11050	Gia Phúc	\N	31	KV02
11065	Trường Tân	\N	31	KV01
11074	Tứ Kỳ	\N	31	KV02
11086	Đại Sơn	\N	31	KV03
11113	Tân Kỳ	\N	31	KV03
11131	Chí Minh	\N	31	KV03
11140	Lạc Phượng	\N	31	KV03
11146	Nguyên Giáp	\N	31	KV03
11164	Vĩnh Lại	\N	31	KV02
11167	Tân An	\N	31	KV02
11203	Ninh Giang	\N	31	KV02
11218	Hồng Châu	\N	31	KV01
11224	Khúc Thừa Dụ	\N	31	KV03
11239	Thanh Miện	\N	31	KV02
11242	Nguyễn Lương Bằng	\N	31	KV01
11254	Bắc Thanh Miện	\N	31	KV02
11257	Hải Hưng	\N	31	KV03
11284	Nam Thanh Miện	\N	31	KV02
11311	Hồng Bàng	\N	31	KV03
11329	Ngô Quyền	\N	31	KV01
11359	Gia Viên	\N	31	KV01
11383	Lê Chân	\N	31	KV03
11407	An Biên	\N	31	KV02
11411	Đông Hải	\N	31	KV01
11413	Hải An	\N	31	KV01
11443	Kiến An	\N	31	KV03
11446	Phù Liễn	\N	31	KV02
11455	Đồ Sơn	\N	31	KV03
11473	Bạch Đằng	\N	31	KV02
11488	Lưu Kiếm	\N	31	KV03
11503	Việt Khê	\N	31	KV01
11506	Lê Ích Mộc	\N	31	KV01
11533	Hòa Bình	\N	31	KV01
11542	Nam Triệu	\N	31	KV02
11557	Thiên Hương	\N	31	KV01
11560	Thủy Nguyên	\N	31	KV01
11581	An Dương	\N	31	KV02
11593	An Phong	\N	31	KV02
11602	Hồng An	\N	31	KV01
11617	An Hải	\N	31	KV02
11629	An Lão	\N	31	KV03
11635	An Trường	\N	31	KV01
11647	An Quang	\N	31	KV03
11668	An Khánh	\N	31	KV02
11674	An Hưng	\N	31	KV03
11680	Kiến Thụy	\N	31	KV01
11689	Hưng Đạo	\N	31	KV02
11692	Dương Kinh	\N	31	KV02
11713	Nghi Dương	\N	31	KV02
11725	Kiến Minh	\N	31	KV03
11728	Kiến Hưng	\N	31	KV03
11737	Nam Đồ Sơn	\N	31	KV02
11749	Kiến Hải	\N	31	KV01
11755	Tiên Lãng	\N	31	KV02
11761	Quyết Thắng	\N	31	KV01
11779	Tân Minh	\N	31	KV01
11791	Tiên Minh	\N	31	KV03
11806	Chấn Hưng	\N	31	KV01
11809	Hùng Thắng	\N	31	KV01
11824	Vĩnh Bảo	\N	31	KV01
11836	Vĩnh Thịnh	\N	31	KV01
11842	Vĩnh Thuận	\N	31	KV01
11848	Vĩnh Hòa	\N	31	KV02
11875	Vĩnh Hải	\N	31	KV02
11887	Vĩnh Am	\N	31	KV03
11911	Nguyễn Bỉnh Khiêm	\N	31	KV03
11914	Đặc khu Cát Hải	\N	31	KV02
11948	Đặc khu Bạch Long Vĩ	\N	31	KV01
11953	Phố Hiến	\N	33	KV03
11977	Tân Hưng	\N	33	KV03
11980	Hồng Châu	\N	33	KV01
11983	Sơn Nam	\N	33	KV03
11992	Lạc Đạo	\N	33	KV02
11995	Đại Đồng	\N	33	KV02
12004	Như Quỳnh	\N	33	KV03
12019	Văn Giang	\N	33	KV03
12025	Phụng Công	\N	33	KV03
12031	Nghĩa Trụ	\N	33	KV03
12049	Mễ Sở	\N	33	KV01
12064	Nguyễn Văn Linh	\N	33	KV03
12070	Hoàn Long	\N	33	KV02
12073	Yên Mỹ	\N	33	KV02
12091	Việt Yên	\N	33	KV03
12103	Mỹ Hào	\N	33	KV01
12127	Thượng Hồng	\N	33	KV03
12133	Đường Hào	\N	33	KV02
12142	Ân Thi	\N	33	KV01
12148	Phạm Ngũ Lão	\N	33	KV03
12166	Xuân Trúc	\N	33	KV02
12184	Nguyễn Trãi	\N	33	KV03
12196	Hồng Quang	\N	33	KV02
12205	Khoái Châu	\N	33	KV02
12223	Triệu Việt Vương	\N	33	KV01
12238	Việt Tiến	\N	33	KV01
12247	Châu Ninh	\N	33	KV01
12271	Chí Minh	\N	33	KV02
12280	Lương Bằng	\N	33	KV02
12286	Nghĩa Dân	\N	33	KV01
12313	Đức Hợp	\N	33	KV01
12322	Hiệp Cường	\N	33	KV01
12337	Hoàng Hoa Thám	\N	33	KV03
12361	Tiên Hoa	\N	33	KV03
12364	Tiên Lữ	\N	33	KV01
12391	Quang Hưng	\N	33	KV01
12406	Đoàn Đào	\N	33	KV01
12424	Tiên Tiến	\N	33	KV02
12427	Tống Trân	\N	33	KV02
12452	Trần Hưng Đạo	\N	33	KV03
12454	Trần Lãm	\N	33	KV03
12466	Vũ Phúc	\N	33	KV03
12472	Quỳnh Phụ	\N	33	KV01
12499	A Sào	\N	33	KV02
12511	Minh Thọ	\N	33	KV01
12517	Ngọc Lâm	\N	33	KV01
12523	Phụ Dực	\N	33	KV02
12526	Đồng Bằng	\N	33	KV01
12532	Nguyễn Du	\N	33	KV03
12577	Quỳnh An	\N	33	KV03
12583	Tân Tiến	\N	33	KV03
12586	Hưng Hà	\N	33	KV02
12595	Ngự Thiên	\N	33	KV01
12613	Long Hưng	\N	33	KV03
12619	Diên Hà	\N	33	KV01
12631	Thần Khê	\N	33	KV02
12634	Tiên La	\N	33	KV03
12676	Lê Quý Đôn	\N	33	KV02
12685	Hồng Minh	\N	33	KV02
12688	Đông Hưng	\N	33	KV03
12694	Bắc Đông Hưng	\N	33	KV03
12700	Bắc Tiên Hưng	\N	33	KV02
12736	Đông Tiên Hưng	\N	33	KV01
12745	Bắc Đông Quan	\N	33	KV01
12754	Tiên Hưng	\N	33	KV03
12763	Nam Tiên Hưng	\N	33	KV03
12775	Nam Đông Hưng	\N	33	KV02
12793	Đông Quan	\N	33	KV01
12817	Trà Lý	\N	33	KV01
12826	Thái Thụy	\N	33	KV03
12850	Tây Thụy Anh	\N	33	KV01
12859	Bắc Thụy Anh	\N	33	KV03
12862	Đông Thụy Anh	\N	33	KV03
12865	Thụy Anh	\N	33	KV03
12904	Nam Thụy Anh	\N	33	KV03
12916	Bắc Thái Ninh	\N	33	KV01
12919	Tây Thái Ninh	\N	33	KV01
12922	Thái Ninh	\N	33	KV02
12943	Đông Thái Ninh	\N	33	KV02
12961	Nam Thái Ninh	\N	33	KV03
12970	Tiền Hải	\N	33	KV02
12988	Đông Tiền Hải	\N	33	KV01
13003	Đồng Châu	\N	33	KV03
13021	Ái Quốc	\N	33	KV01
13039	Tây Tiền Hải	\N	33	KV02
13057	Nam Cường	\N	33	KV03
13063	Nam Tiền Hải	\N	33	KV01
13066	Hưng Phú	\N	33	KV03
13075	Kiến Xương	\N	33	KV02
13093	Trà Giang	\N	33	KV03
13096	Bình Nguyên	\N	33	KV02
13120	Lê Lợi	\N	33	KV01
13132	Quang Lịch	\N	33	KV02
13141	Vũ Quý	\N	33	KV03
13159	Hồng Vũ	\N	33	KV02
13183	Bình Thanh	\N	33	KV03
13186	Bình Định	\N	33	KV03
13192	Vũ Thư	\N	33	KV01
13219	Vạn Xuân	\N	33	KV01
13222	Thư Trì	\N	33	KV01
13225	Thái Bình	\N	33	KV02
13246	Tân Thuận	\N	33	KV03
13264	Thư Vũ	\N	33	KV02
13279	Vũ Tiên	\N	33	KV02
13285	Phủ Lý	\N	37	KV03
13291	Phù Vân	\N	37	KV03
13318	Châu Sơn	\N	37	KV01
13324	Duy Tiên	\N	37	KV01
13330	Duy Tân	\N	37	KV03
13336	Duy Hà	\N	37	KV02
13348	Đồng Văn	\N	37	KV02
13363	Tiên Sơn	\N	37	KV02
13366	Hà Nam	\N	37	KV03
13384	Kim Bảng	\N	37	KV03
13393	Lê Hồ	\N	37	KV03
13396	Nguyễn Uý	\N	37	KV02
13402	Kim Thanh	\N	37	KV02
13420	Tam Chúc	\N	37	KV01
13435	Lý Thường Kiệt	\N	37	KV03
13444	Liêm Tuyền	\N	37	KV03
13456	Liêm Hà	\N	37	KV02
13474	Tân Thanh	\N	37	KV01
13483	Thanh Bình	\N	37	KV02
13489	Thanh Lâm	\N	37	KV01
13495	Thanh Liêm	\N	37	KV03
13501	Bình Mỹ	\N	37	KV02
13504	Bình Lục	\N	37	KV01
13531	Bình Giang	\N	37	KV03
13540	Bình An	\N	37	KV01
13558	Bình Sơn	\N	37	KV01
13573	Lý Nhân	\N	37	KV01
13579	Bắc Lý	\N	37	KV03
13591	Nam Xang	\N	37	KV01
13594	Trần Thương	\N	37	KV02
13597	Vĩnh Trụ	\N	37	KV03
13609	Nhân Hà	\N	37	KV02
13627	Nam Lý	\N	37	KV03
13669	Nam Định	\N	37	KV03
13684	Thiên Trường	\N	37	KV01
13693	Đông A	\N	37	KV03
13699	Thành Nam	\N	37	KV03
13708	Mỹ Lộc	\N	37	KV02
13741	Vụ Bản	\N	37	KV02
13750	Minh Tân	\N	37	KV01
13753	Hiển Khánh	\N	37	KV03
13777	Trường Thi	\N	37	KV01
13786	Liên Minh	\N	37	KV01
13795	Ý Yên	\N	37	KV01
13807	Tân Minh	\N	37	KV03
13822	Phong Doanh	\N	37	KV01
13834	Vũ Dương	\N	37	KV03
13864	Vạn Thắng	\N	37	KV03
13870	Yên Cường	\N	37	KV03
13879	Yên Đồng	\N	37	KV02
13891	Nghĩa Hưng	\N	37	KV02
13894	Rạng Đông	\N	37	KV01
13900	Đồng Thịnh	\N	37	KV03
13918	Nghĩa Sơn	\N	37	KV03
13927	Hồng Phong	\N	37	KV02
13939	Quỹ Nhất	\N	37	KV01
13957	Nghĩa Lâm	\N	37	KV02
13966	Nam Trực	\N	37	KV02
13972	Vị Khê	\N	37	KV01
13984	Hồng Quang	\N	37	KV02
13987	Nam Hồng	\N	37	KV03
14005	Nam Ninh	\N	37	KV03
14011	Nam Minh	\N	37	KV03
14014	Nam Đồng	\N	37	KV03
14026	Cổ Lễ	\N	37	KV02
14038	Ninh Giang	\N	37	KV03
14053	Trực Ninh	\N	37	KV03
14056	Cát Thành	\N	37	KV02
14062	Quang Hưng	\N	37	KV02
14071	Minh Thái	\N	37	KV02
14077	Ninh Cường	\N	37	KV03
14089	Xuân Trường	\N	37	KV03
14095	Xuân Hồng	\N	37	KV02
14104	Xuân Giang	\N	37	KV01
14122	Xuân Hưng	\N	37	KV02
14161	Giao Minh	\N	37	KV02
14167	Giao Thuỷ	\N	37	KV01
14179	Giao Hưng	\N	37	KV02
14182	Giao Hoà	\N	37	KV02
14194	Giao Bình	\N	37	KV01
14203	Giao Phúc	\N	37	KV01
14212	Giao Ninh	\N	37	KV03
14215	Hải Hậu	\N	37	KV02
14218	Hải Tiến	\N	37	KV01
14221	Hải Thịnh	\N	37	KV03
14236	Hải Anh	\N	37	KV01
14248	Hải Hưng	\N	37	KV01
14281	Hải An	\N	37	KV03
14287	Hải Quang	\N	37	KV02
14308	Hải Xuân	\N	37	KV02
14329	Hoa Lư	\N	37	KV01
14359	Nam Hoa Lư	\N	37	KV03
14362	Tam Điệp	\N	37	KV01
14365	Trung Sơn	\N	37	KV03
14371	Yên Sơn	\N	37	KV03
14389	Gia Lâm	\N	37	KV02
14401	Gia Tường	\N	37	KV02
14404	Cúc Phương	\N	37	KV02
14407	Phú Sơn	\N	37	KV01
14428	Nho Quan	\N	37	KV02
14434	Thanh Sơn	\N	37	KV02
14452	Quỳnh Lưu	\N	37	KV02
14458	Phú Long	\N	37	KV01
14464	Gia Viễn	\N	37	KV01
14482	Gia Hưng	\N	37	KV01
14488	Gia Vân	\N	37	KV02
14494	Gia Trấn	\N	37	KV01
14500	Đại Hoàng	\N	37	KV02
14524	Gia Phong	\N	37	KV01
14533	Tây Hoa Lư	\N	37	KV01
14560	Yên Khánh	\N	37	KV01
14563	Khánh Thiện	\N	37	KV03
14566	Đông Hoa Lư	\N	37	KV02
14608	Khánh Trung	\N	37	KV03
14611	Khánh Nhạc	\N	37	KV03
14614	Khánh Hội	\N	37	KV02
14620	Phát Diệm	\N	37	KV01
14623	Bình Minh	\N	37	KV03
14638	Kim Sơn	\N	37	KV02
14647	Quang Thiện	\N	37	KV02
14653	Chất Bình	\N	37	KV03
14674	Lai Thành	\N	37	KV02
14677	Định Hóa	\N	37	KV01
14698	Kim Đông	\N	37	KV01
14701	Yên Mô	\N	37	KV03
14725	Yên Thắng	\N	37	KV03
14728	Yên Từ	\N	37	KV01
14743	Yên Mạc	\N	37	KV01
14746	Đồng Thái	\N	37	KV01
14758	Hàm Rồng	\N	38	KV03
14797	Hạc Thành	\N	38	KV03
14812	Bỉm Sơn	\N	38	KV03
14818	Quang Trung	\N	38	KV01
14845	Mường Lát	\N	38	KV03
14848	Tam Chung	\N	38	KV01
14854	Mường Lý	\N	38	KV02
14857	Trung Lý	\N	38	KV02
14860	Quang Chiểu	\N	38	KV03
14863	Pù Nhi	\N	38	KV02
14864	Nhi Sơn	\N	38	KV02
14866	Mường Chanh	\N	38	KV01
14869	Hồi Xuân	\N	38	KV01
14872	Trung Thành	\N	38	KV01
14875	Trung Sơn	\N	38	KV03
14878	Phú Lệ	\N	38	KV02
14890	Phú Xuân	\N	38	KV03
14896	Hiền Kiệt	\N	38	KV03
14902	Nam Xuân	\N	38	KV01
14908	Thiên Phủ	\N	38	KV01
14923	Bá Thước	\N	38	KV01
14932	Điền Quang	\N	38	KV03
14950	Điền Lư	\N	38	KV01
14953	Quý Lương	\N	38	KV03
14956	Pù Luông	\N	38	KV01
14959	Cổ Lũng	\N	38	KV01
14974	Văn Nho	\N	38	KV02
14980	Thiết Ống	\N	38	KV03
15001	Trung Hạ	\N	38	KV01
15007	Tam Thanh	\N	38	KV02
15010	Sơn Thủy	\N	38	KV02
15013	Na Mèo	\N	38	KV01
15016	Quan Sơn	\N	38	KV01
15019	Tam Lư	\N	38	KV02
15022	Sơn Điện	\N	38	KV01
15025	Mường Mìn	\N	38	KV02
15031	Yên Khương	\N	38	KV02
15034	Yên Thắng	\N	38	KV02
15043	Giao An	\N	38	KV02
15049	Văn Phú	\N	38	KV02
15055	Linh Sơn	\N	38	KV01
15058	Đồng Lương	\N	38	KV03
15061	Ngọc Lặc	\N	38	KV03
15085	Thạch Lập	\N	38	KV03
15091	Ngọc Liên	\N	38	KV01
15106	Nguyệt Ấn	\N	38	KV03
15112	Kiên Thọ	\N	38	KV02
15124	Minh Sơn	\N	38	KV01
15127	Cẩm Thủy	\N	38	KV02
15142	Cẩm Thạch	\N	38	KV01
15148	Cẩm Tú	\N	38	KV02
15163	Cẩm Vân	\N	38	KV02
15178	Cẩm Tân	\N	38	KV01
15187	Kim Tân	\N	38	KV01
15190	Vân Du	\N	38	KV01
15199	Thạch Quảng	\N	38	KV02
15211	Thạch Bình	\N	38	KV02
15229	Thành Vinh	\N	38	KV02
15250	Ngọc Trạo	\N	38	KV01
15271	Hà Trung	\N	38	KV02
15274	Hà Long	\N	38	KV02
15286	Hoạt Giang	\N	38	KV03
15298	Lĩnh Toại	\N	38	KV01
15316	Tống Sơn	\N	38	KV02
15349	Vĩnh Lộc	\N	38	KV02
15361	Tây Đô	\N	38	KV01
15382	Biện Thượng	\N	38	KV01
15409	Yên Phú	\N	38	KV01
15412	Quý Lộc	\N	38	KV02
15421	Yên Trường	\N	38	KV01
15442	Yên Ninh	\N	38	KV01
15448	Định Hòa	\N	38	KV02
15457	Định Tân	\N	38	KV02
15469	Yên Định	\N	38	KV02
15499	Thọ Xuân	\N	38	KV03
15505	Thọ Long	\N	38	KV03
15520	Xuân Hòa	\N	38	KV02
15544	Lam Sơn	\N	38	KV01
15553	Sao Vàng	\N	38	KV03
15568	Thọ Lập	\N	38	KV01
15574	Xuân Tín	\N	38	KV02
15592	Xuân Lập	\N	38	KV02
15607	Bát Mọt	\N	38	KV01
15610	Yên Nhân	\N	38	KV02
15622	Vạn Xuân	\N	38	KV02
15628	Lương Sơn	\N	38	KV02
15634	Luận Thành	\N	38	KV03
15643	Thắng Lộc	\N	38	KV03
15646	Thường Xuân	\N	38	KV01
15658	Xuân Chinh	\N	38	KV01
15661	Tân Thành	\N	38	KV03
15664	Triệu Sơn	\N	38	KV02
15667	Thọ Bình	\N	38	KV03
15682	Hợp Tiến	\N	38	KV02
15715	Tân Ninh	\N	38	KV03
15724	Đồng Tiến	\N	38	KV01
15754	Thọ Ngọc	\N	38	KV01
15763	Thọ Phú	\N	38	KV03
15766	An Nông	\N	38	KV03
15772	Thiệu Hóa	\N	38	KV01
15778	Thiệu Tiến	\N	38	KV03
15796	Thiệu Quang	\N	38	KV01
15820	Thiệu Toán	\N	38	KV03
15835	Thiệu Trung	\N	38	KV03
15853	Đông Tiến	\N	38	KV03
15865	Hoằng Hóa	\N	38	KV03
15880	Hoằng Giang	\N	38	KV02
15889	Hoằng Phú	\N	38	KV02
15910	Hoằng Sơn	\N	38	KV01
15925	Nguyệt Viên	\N	38	KV01
15961	Hoằng Lộc	\N	38	KV01
15976	Hoằng Châu	\N	38	KV02
15991	Hoằng Tiến	\N	38	KV01
16000	Hoằng Thanh	\N	38	KV03
16012	Hậu Lộc	\N	38	KV01
16021	Triệu Lộc	\N	38	KV01
16033	Đông Thành	\N	38	KV02
16072	Hoa Lộc	\N	38	KV01
16078	Vạn Lộc	\N	38	KV02
16093	Nga Sơn	\N	38	KV02
16108	Tân Tiến	\N	38	KV03
16114	Nga Thắng	\N	38	KV02
16138	Hồ Vương	\N	38	KV02
16144	Nga An	\N	38	KV02
16171	Ba Đình	\N	38	KV01
16174	Như Xuân	\N	38	KV03
16177	Xuân Bình	\N	38	KV01
16186	Hóa Quỳ	\N	38	KV01
16213	Thanh Phong	\N	38	KV01
16222	Thanh Quân	\N	38	KV01
16225	Thượng Ninh	\N	38	KV02
16228	Như Thanh	\N	38	KV03
16234	Xuân Du	\N	38	KV03
16249	Mậu Lâm	\N	38	KV01
16258	Xuân Thái	\N	38	KV02
16264	Yên Thọ	\N	38	KV03
16273	Thanh Kỳ	\N	38	KV02
16279	Nông Cống	\N	38	KV01
16297	Trung Chính	\N	38	KV01
16309	Thắng Lợi	\N	38	KV01
16342	Thăng Bình	\N	38	KV02
16348	Trường Văn	\N	38	KV01
16363	Tượng Lĩnh	\N	38	KV01
16369	Công Chính	\N	38	KV02
16378	Đông Sơn	\N	38	KV01
16417	Đông Quang	\N	38	KV03
16438	Lưu Vệ	\N	38	KV01
16480	Quảng Yên	\N	38	KV02
16489	Quảng Chính	\N	38	KV01
16498	Quảng Ngọc	\N	38	KV02
16516	Nam Sầm Sơn	\N	38	KV02
16522	Quảng Phú	\N	38	KV02
16531	Sầm Sơn	\N	38	KV01
16540	Quảng Ninh	\N	38	KV01
16543	Quảng Bình	\N	38	KV01
16549	Tiên Trang	\N	38	KV01
16561	Tĩnh Gia	\N	38	KV02
16576	Ngọc Sơn	\N	38	KV01
16591	Các Sơn	\N	38	KV02
16594	Tân Dân	\N	38	KV02
16597	Hải Lĩnh	\N	38	KV02
16609	Đào Duy Từ	\N	38	KV02
16624	Trúc Lâm	\N	38	KV01
16636	Trường Lâm	\N	38	KV02
16645	Hải Bình	\N	38	KV02
16654	Nghi Sơn	\N	38	KV01
16681	Thành Vinh	\N	40	KV01
16690	Trường Vinh	\N	40	KV01
16702	Vinh Phú	\N	40	KV02
16708	Vinh Lộc	\N	40	KV03
16732	Cửa Lò	\N	40	KV02
16738	Quế Phong	\N	40	KV03
16744	Thông Thụ	\N	40	KV03
16750	Tiền Phong	\N	40	KV02
16756	Tri Lễ	\N	40	KV03
16774	Mường Quàng	\N	40	KV02
16777	Quỳ Châu	\N	40	KV03
16792	Châu Tiến	\N	40	KV02
16801	Hùng Chân	\N	40	KV01
16804	Châu Bình	\N	40	KV01
16813	Mường Xén	\N	40	KV01
16816	Mỹ Lý	\N	40	KV02
16819	Bắc Lý	\N	40	KV01
16822	Keng Đu	\N	40	KV03
16828	Huồi Tụ	\N	40	KV01
16831	Mường Lống	\N	40	KV02
16834	Na Loi	\N	40	KV02
16837	Nậm Cắn	\N	40	KV03
16849	Hữu Kiệm	\N	40	KV03
16855	Chiêu Lưu	\N	40	KV01
16858	Mường Típ	\N	40	KV02
16870	Na Ngoi	\N	40	KV02
16876	Tương Dương	\N	40	KV02
16882	Nhôn Mai	\N	40	KV03
16885	Hữu Khuông	\N	40	KV02
16903	Nga My	\N	40	KV03
16906	Lượng Minh	\N	40	KV01
16909	Yên Hòa	\N	40	KV02
16912	Yên Na	\N	40	KV02
16933	Tam Quang	\N	40	KV03
16936	Tam Thái	\N	40	KV02
16939	Thái Hòa	\N	40	KV02
16941	Nghĩa Đàn	\N	40	KV01
16951	Nghĩa Lâm	\N	40	KV01
16969	Nghĩa Thọ	\N	40	KV01
16972	Nghĩa Hưng	\N	40	KV03
16975	Nghĩa Mai	\N	40	KV02
17011	Tây Hiếu	\N	40	KV02
17017	Đông Hiếu	\N	40	KV02
17029	Nghĩa Lộc	\N	40	KV01
17032	Nghĩa Khánh	\N	40	KV01
17035	Quỳ Hợp	\N	40	KV03
17044	Châu Hồng	\N	40	KV01
17056	Châu Lộc	\N	40	KV02
17059	Tam Hợp	\N	40	KV01
17071	Minh Hợp	\N	40	KV03
17077	Mường Ham	\N	40	KV02
17089	Mường Chọng	\N	40	KV02
17110	Hoàng Mai	\N	40	KV01
17125	Quỳnh Mai	\N	40	KV01
17128	Tân Mai	\N	40	KV02
17143	Quỳnh Văn	\N	40	KV03
17149	Quỳnh Tam	\N	40	KV03
17170	Quỳnh Sơn	\N	40	KV01
17176	Quỳnh Anh	\N	40	KV03
17179	Quỳnh Lưu	\N	40	KV02
17212	Quỳnh Phú	\N	40	KV01
17224	Quỳnh Thắng	\N	40	KV01
17230	Bình Chuẩn	\N	40	KV02
17239	Mậu Thạch	\N	40	KV02
17242	Cam Phục	\N	40	KV02
17248	Châu Khê	\N	40	KV01
17254	Con Cuông	\N	40	KV03
17263	Môn Sơn	\N	40	KV01
17266	Tân Kỳ	\N	40	KV01
17272	Tân Phú	\N	40	KV02
17278	Giai Xuân	\N	40	KV03
17284	Nghĩa Đồng	\N	40	KV01
17287	Tiên Đồng	\N	40	KV03
17305	Tân An	\N	40	KV03
17326	Nghĩa Hành	\N	40	KV01
17329	Anh Sơn	\N	40	KV02
17335	Thành Bình Thọ	\N	40	KV02
17344	Nhân Hòa	\N	40	KV03
17357	Vĩnh Tường	\N	40	KV03
17365	Anh Sơn Đông	\N	40	KV02
17380	Yên Xuân	\N	40	KV03
17395	Hùng Châu	\N	40	KV02
17416	Đức Châu	\N	40	KV03
17419	Hải Châu	\N	40	KV03
17443	Quảng Châu	\N	40	KV02
17464	Diễn Châu	\N	40	KV02
17476	Minh Châu	\N	40	KV03
17479	An Châu	\N	40	KV02
17488	Tân Châu	\N	40	KV01
17506	Yên Thành	\N	40	KV03
17515	Bình Minh	\N	40	KV01
17521	Quang Đồng	\N	40	KV02
17524	Giai Lạc	\N	40	KV03
17530	Đông Thành	\N	40	KV01
17560	Vân Du	\N	40	KV03
17569	Quan Thành	\N	40	KV02
17605	Hợp Minh	\N	40	KV01
17611	Vân Tụ	\N	40	KV01
17623	Bạch Ngọc	\N	40	KV03
17641	Lương Sơn	\N	40	KV02
17662	Đô Lương	\N	40	KV02
17677	Văn Hiến	\N	40	KV03
17689	Thuần Trung	\N	40	KV02
17707	Bạch Hà	\N	40	KV02
17713	Đại Đồng	\N	40	KV02
17722	Hạnh Lâm	\N	40	KV02
17728	Cát Ngạn	\N	40	KV02
17743	Tam Đồng	\N	40	KV02
17759	Sơn Lâm	\N	40	KV02
17770	Hoa Quân	\N	40	KV01
17779	Xuân Lâm	\N	40	KV02
17791	Kim Bảng	\N	40	KV01
17818	Bích Hào	\N	40	KV01
17827	Nghi Lộc	\N	40	KV01
17833	Hải Lộc	\N	40	KV03
17842	Thần Lĩnh	\N	40	KV03
17854	Văn Kiều	\N	40	KV03
17857	Phúc Lộc	\N	40	KV03
17866	Trung Lộc	\N	40	KV01
17878	Đông Lộc	\N	40	KV03
17920	Vinh Hưng	\N	40	KV03
17935	Nam Đàn	\N	40	KV02
17944	Đại Huệ	\N	40	KV02
17950	Vạn An	\N	40	KV03
17971	Kim Liên	\N	40	KV02
17989	Thiên Nhẫn	\N	40	KV02
18001	Hưng Nguyên	\N	40	KV03
18007	Yên Trung	\N	40	KV02
18028	Hưng Nguyên Nam	\N	40	KV02
18040	Lam Thành	\N	40	KV03
18073	Thành Sen	\N	42	KV01
18100	Trần Phú	\N	42	KV03
18115	Bắc Hồng Lĩnh	\N	42	KV01
18118	Nam Hồng Lĩnh	\N	42	KV02
18133	Hương Sơn	\N	42	KV01
18160	Sơn Hồng	\N	42	KV01
18163	Sơn Tiến	\N	42	KV03
18172	Sơn Tây	\N	42	KV02
18184	Sơn Giang	\N	42	KV01
18196	Sơn Kim 1	\N	42	KV02
18199	Sơn Kim 2	\N	42	KV02
18202	Tứ Mỹ	\N	42	KV01
18223	Kim Hoa	\N	42	KV01
18229	Đức Thọ	\N	42	KV01
18244	Đức Minh	\N	42	KV02
18262	Đức Quang	\N	42	KV03
18277	Đức Thịnh	\N	42	KV02
18304	Đức Đồng	\N	42	KV03
18313	Vũ Quang	\N	42	KV03
18322	Mai Hoa	\N	42	KV02
18328	Thượng Đức	\N	42	KV01
18352	Nghi Xuân	\N	42	KV03
18364	Đan Hải	\N	42	KV01
18373	Tiên Điền	\N	42	KV02
18394	Cổ Đạm	\N	42	KV02
18406	Can Lộc	\N	42	KV02
18409	Hồng Lộc	\N	42	KV03
18418	Tùng Lộc	\N	42	KV02
18436	Trường Lưu	\N	42	KV02
18466	Gia Hanh	\N	42	KV01
18481	Xuân Lộc	\N	42	KV01
18484	Đồng Lộc	\N	42	KV02
18496	Hương Khê	\N	42	KV02
18502	Hà Linh	\N	42	KV01
18523	Hương Bình	\N	42	KV01
18532	Hương Phố	\N	42	KV03
18544	Hương Xuân	\N	42	KV03
18547	Phúc Trạch	\N	42	KV02
18550	Hương Đô	\N	42	KV03
18562	Thạch Hà	\N	42	KV01
18568	Lộc Hà	\N	42	KV03
18583	Mai Phụ	\N	42	KV02
18586	Đông Kinh	\N	42	KV02
18601	Việt Xuyên	\N	42	KV03
18604	Thạch Khê	\N	42	KV03
18619	Đồng Tiến	\N	42	KV01
18628	Thạch Lạc	\N	42	KV01
18634	Toàn Lưu	\N	42	KV02
18652	Hà Huy Tập	\N	42	KV01
18667	Thạch Xuân	\N	42	KV01
18673	Cẩm Xuyên	\N	42	KV03
18676	Thiên Cầm	\N	42	KV03
18682	Yên Hòa	\N	42	KV01
18685	Cẩm Bình	\N	42	KV02
18736	Cẩm Hưng	\N	42	KV03
18739	Cẩm Duệ	\N	42	KV02
18742	Cẩm Trung	\N	42	KV01
18748	Cẩm Lạc	\N	42	KV03
18754	Sông Trí	\N	42	KV01
18766	Kỳ Xuân	\N	42	KV02
18775	Kỳ Anh	\N	42	KV01
18781	Hải Ninh	\N	42	KV01
18787	Kỳ Văn	\N	42	KV03
18790	Kỳ Khang	\N	42	KV03
18814	Kỳ Hoa	\N	42	KV01
18823	Vũng Áng	\N	42	KV01
18832	Hoành Sơn	\N	42	KV02
18838	Kỳ Lạc	\N	42	KV02
18844	Kỳ Thượng	\N	42	KV01
18859	Đồng Thuận	\N	44	KV01
18871	Đồng Sơn	\N	44	KV01
18880	Đồng Hới	\N	44	KV03
18901	Minh Hóa	\N	44	KV02
18904	Dân Hóa	\N	44	KV01
18919	Tân Thành	\N	44	KV01
18922	Kim Điền	\N	44	KV02
18943	Kim Phú	\N	44	KV02
18949	Đồng Lê	\N	44	KV02
18952	Tuyên Sơn	\N	44	KV03
18958	Tuyên Lâm	\N	44	KV03
18985	Tuyên Phú	\N	44	KV02
18991	Tuyên Bình	\N	44	KV01
18997	Tuyên Hóa	\N	44	KV01
19009	Ba Đồn	\N	44	KV02
19021	Phú Trạch	\N	44	KV03
19030	Trung Thuần	\N	44	KV02
19033	Hòa Trạch	\N	44	KV02
19051	Tân Gianh	\N	44	KV03
19057	Quảng Trạch	\N	44	KV02
19066	Bắc Gianh	\N	44	KV03
19075	Nam Ba Đồn	\N	44	KV01
19093	Nam Gianh	\N	44	KV03
19111	Hoàn Lão	\N	44	KV02
19126	Bắc Trạch	\N	44	KV01
19138	Phong Nha	\N	44	KV02
19141	Bố Trạch	\N	44	KV03
19147	Thượng Trạch	\N	44	KV02
19159	Đông Trạch	\N	44	KV01
19198	Nam Trạch	\N	44	KV03
19204	Trường Sơn	\N	44	KV02
19207	Quảng Ninh	\N	44	KV03
19225	Ninh Châu	\N	44	KV01
19237	Trường Ninh	\N	44	KV02
19246	Lệ Ninh	\N	44	KV03
19249	Lệ Thủy	\N	44	KV03
19255	Cam Hồng	\N	44	KV02
19288	Sen Ngư	\N	44	KV01
19291	Tân Mỹ	\N	44	KV02
19309	Trường Phú	\N	44	KV01
19318	Kim Ngân	\N	44	KV02
19333	Đông Hà	\N	44	KV01
19351	Nam Đông Hà	\N	44	KV03
19360	Quảng Trị	\N	44	KV01
19363	Vĩnh Linh	\N	44	KV03
19366	Bến Quan	\N	44	KV03
19372	Vĩnh Hoàng	\N	44	KV03
19405	Vĩnh Thủy	\N	44	KV01
19414	Cửa Tùng	\N	44	KV02
19429	Khe Sanh	\N	44	KV03
19432	Lao Bảo	\N	44	KV01
19435	Hướng Lập	\N	44	KV03
19441	Hướng Phùng	\N	44	KV03
19462	Tân Lập	\N	44	KV03
19483	A Dơi	\N	44	KV03
19489	Lìa	\N	44	KV01
19495	Gio Linh	\N	44	KV01
19496	Cửa Việt	\N	44	KV03
19501	Bến Hải	\N	44	KV02
19537	Cồn Tiên	\N	44	KV02
19555	Hướng Hiệp	\N	44	KV03
19564	Đakrông	\N	44	KV02
19567	Ba Lòng	\N	44	KV01
19588	Tà Rụt	\N	44	KV01
19594	La Lay	\N	44	KV02
19597	Cam Lộ	\N	44	KV02
19603	Hiếu Giang	\N	44	KV02
19624	Triệu Phong	\N	44	KV01
19639	Nam Cửa Việt	\N	44	KV02
19645	Triệu Bình	\N	44	KV01
19654	Triệu Cơ	\N	44	KV01
19669	Ái Tử	\N	44	KV01
19681	Diên Sanh	\N	44	KV01
19699	Vĩnh Định	\N	44	KV01
19702	Hải Lăng	\N	44	KV01
19735	Nam Hải Lăng	\N	44	KV02
19741	Mỹ Thủy	\N	44	KV02
19742	Đặc khu Cồn Cỏ	\N	44	KV03
19753	Phú Xuân	\N	46	KV01
19774	Kim Long	\N	46	KV03
19777	Vỹ Dạ	\N	46	KV01
19789	Thuận Hóa	\N	46	KV03
19804	Hương An	\N	46	KV01
19813	Thủy Xuân	\N	46	KV03
19815	An Cựu	\N	46	KV01
19819	Phong Điền	\N	46	KV01
19828	Phong Phú	\N	46	KV02
19831	Phong Dinh	\N	46	KV02
19858	Phong Thái	\N	46	KV01
19867	Quảng Điền	\N	46	KV03
19873	Phong Quảng	\N	46	KV03
19885	Đan Điền	\N	46	KV03
19900	Thuận An	\N	46	KV02
19909	Dương Nỗ	\N	46	KV02
19918	Phú Hồ	\N	46	KV03
19930	Mỹ Thượng	\N	46	KV03
19942	Phú Vang	\N	46	KV03
19945	Phú Vinh	\N	46	KV02
19960	Phú Bài	\N	46	KV03
19969	Thanh Thủy	\N	46	KV03
19975	Hương Thủy	\N	46	KV03
19996	Hương Trà	\N	46	KV01
20014	Hóa Châu	\N	46	KV01
20017	Kim Trà	\N	46	KV02
20035	Bình Điền	\N	46	KV02
20044	A Lưới 2	\N	46	KV03
20050	A Lưới 5	\N	46	KV01
20056	A Lưới 1	\N	46	KV03
20071	A Lưới 3	\N	46	KV02
20101	A Lưới 4	\N	46	KV02
20107	Phú Lộc	\N	46	KV03
20122	Vinh Lộc	\N	46	KV02
20131	Hưng Lộc	\N	46	KV01
20137	Chân Mây - Lăng Cô	\N	46	KV03
20140	Lộc An	\N	46	KV02
20161	Khe Tre	\N	46	KV02
20179	Nam Đông	\N	46	KV01
20182	Long Quảng	\N	46	KV02
20194	Hải Vân	\N	48	KV02
20197	Liên Chiểu	\N	48	KV02
20200	Hòa Khánh	\N	48	KV03
20209	Thanh Khê	\N	48	KV01
20242	Hải Châu	\N	48	KV01
20257	Hòa Cường	\N	48	KV03
20260	Cẩm Lệ	\N	48	KV03
20263	Sơn Trà	\N	48	KV01
20275	An Hải	\N	48	KV02
20285	Ngũ Hành Sơn	\N	48	KV02
20305	An Khê	\N	48	KV02
20308	Bà Nà	\N	48	KV02
20314	Hòa Xuân	\N	48	KV03
20320	Hòa Vang	\N	48	KV01
20332	Hòa Tiến	\N	48	KV02
20333	Đặc khu Hoàng Sa	\N	48	KV01
20335	Bàn Thạch	\N	48	KV02
20341	Tam Kỳ	\N	48	KV03
20350	Hương Trà	\N	48	KV02
20356	Quảng Phú	\N	48	KV01
20364	Chiên Đàn	\N	48	KV03
20380	Tây Hồ	\N	48	KV01
20392	Phú Ninh	\N	48	KV02
20401	Hội An Tây	\N	48	KV01
20410	Hội An	\N	48	KV03
20413	Hội An Đông	\N	48	KV02
20434	Tân Hiệp	\N	48	KV01
20443	Hùng Sơn	\N	48	KV03
20455	Tây Giang	\N	48	KV02
20458	Avương	\N	48	KV03
20467	Đông Giang	\N	48	KV03
20476	Sông Kôn	\N	48	KV02
20485	Sông Vàng	\N	48	KV03
20494	Bến Hiên	\N	48	KV01
20500	Đại Lộc	\N	48	KV02
20506	Thượng Đức	\N	48	KV03
20515	Hà Nha	\N	48	KV01
20539	Vu Gia	\N	48	KV02
20542	Phú Thuận	\N	48	KV03
20551	Điện Bàn	\N	48	KV02
20557	Điện Bàn Bắc	\N	48	KV01
20569	Điện Bàn Tây	\N	48	KV02
20575	An Thắng	\N	48	KV02
20579	Điện Bàn Đông	\N	48	KV01
20587	Gò Nổi	\N	48	KV01
20599	Nam Phước	\N	48	KV03
20611	Thu Bồn	\N	48	KV03
20623	Duy Xuyên	\N	48	KV03
20635	Duy Nghĩa	\N	48	KV02
20641	Quế Sơn	\N	48	KV02
20650	Xuân Phú	\N	48	KV01
20656	Nông Sơn	\N	48	KV01
20662	Quế Sơn Trung	\N	48	KV01
20669	Quế Phước	\N	48	KV01
20695	Thạnh Mỹ	\N	48	KV01
20698	La Êê	\N	48	KV02
20704	La Dêê	\N	48	KV03
20707	Nam Giang	\N	48	KV03
20710	Bến Giằng	\N	48	KV03
20716	Đắc Pring	\N	48	KV02
20722	Khâm Đức	\N	48	KV02
20728	Phước Hiệp	\N	48	KV02
20734	Phước Năng	\N	48	KV02
20740	Phước Chánh	\N	48	KV02
20752	Phước Thành	\N	48	KV01
20767	Việt An	\N	48	KV01
20770	Phước Trà	\N	48	KV01
20779	Hiệp Đức	\N	48	KV03
20791	Thăng Bình	\N	48	KV02
20794	Thăng An	\N	48	KV02
20818	Đồng Dương	\N	48	KV02
20827	Thăng Phú	\N	48	KV01
20836	Thăng Trường	\N	48	KV03
20848	Thăng Điền	\N	48	KV01
20854	Tiên Phước	\N	48	KV01
20857	Sơn Cẩm Hà	\N	48	KV01
20875	Lãnh Ngọc	\N	48	KV03
20878	Thạnh Bình	\N	48	KV01
20900	Trà My	\N	48	KV02
20908	Trà Liên	\N	48	KV03
20920	Trà Đốc	\N	48	KV03
20923	Trà Tân	\N	48	KV01
20929	Trà Giáp	\N	48	KV03
20938	Trà Leng	\N	48	KV01
20941	Trà Tập	\N	48	KV01
20944	Nam Trà My	\N	48	KV03
20950	Trà Linh	\N	48	KV02
20959	Trà Vân	\N	48	KV01
20965	Núi Thành	\N	48	KV02
20971	Tam Xuân	\N	48	KV02
20977	Đức Phú	\N	48	KV03
20984	Tam Anh	\N	48	KV01
20992	Tam Hải	\N	48	KV03
21004	Tam Mỹ	\N	48	KV01
21025	Cẩm Thành	\N	51	KV01
21028	Nghĩa Lộ	\N	51	KV03
21034	An Phú	\N	51	KV01
21040	Bình Sơn	\N	51	KV03
21061	Vạn Tường	\N	51	KV02
21085	Bình Minh	\N	51	KV02
21100	Bình Chương	\N	51	KV02
21109	Đông Sơn	\N	51	KV01
21115	Trà Bồng	\N	51	KV03
21124	Thanh Bồng	\N	51	KV03
21127	Đông Trà Bồng	\N	51	KV01
21136	Cà Đam	\N	51	KV03
21154	Tây Trà	\N	51	KV02
21157	Tây Trà Bồng	\N	51	KV01
21172	Trương Quang Trọng	\N	51	KV01
21181	Thọ Phong	\N	51	KV03
21196	Trường Giang	\N	51	KV02
21205	Ba Gia	\N	51	KV01
21211	Tịnh Khê	\N	51	KV01
21220	Sơn Tịnh	\N	51	KV03
21235	Tư Nghĩa	\N	51	KV01
21238	Vệ Giang	\N	51	KV01
21244	Trà Giang	\N	51	KV03
21250	Nghĩa Giang	\N	51	KV01
21289	Sơn Hà	\N	51	KV02
21292	Sơn Hạ	\N	51	KV03
21307	Sơn Linh	\N	51	KV03
21319	Sơn Thủy	\N	51	KV03
21325	Sơn Kỳ	\N	51	KV01
21334	Sơn Tây Thượng	\N	51	KV03
21340	Sơn Tây	\N	51	KV02
21343	Sơn Tây Hạ	\N	51	KV01
21349	Sơn Mai	\N	51	KV01
21361	Minh Long	\N	51	KV03
21364	Nghĩa Hành	\N	51	KV02
21370	Phước Giang	\N	51	KV03
21385	Đình Cương	\N	51	KV01
21388	Thiện Tín	\N	51	KV03
21400	Mộ Đức	\N	51	KV01
21409	Long Phụng	\N	51	KV03
21421	Mỏ Cày	\N	51	KV02
21433	Lân Phong	\N	51	KV02
21439	Đức Phổ	\N	51	KV02
21451	Trà Câu	\N	51	KV02
21457	Nguyễn Nghiêm	\N	51	KV03
21472	Khánh Cường	\N	51	KV01
21478	Sa Huỳnh	\N	51	KV03
21484	Ba Tơ	\N	51	KV01
21490	Ba Vinh	\N	51	KV01
21496	Ba Động	\N	51	KV03
21499	Ba Dinh	\N	51	KV03
21520	Đặng Thùy Trâm	\N	51	KV02
21523	Ba Tô	\N	51	KV01
21529	Ba Vì	\N	51	KV01
21538	Ba Xa	\N	51	KV03
21548	Đặc khu Lý Sơn	\N	51	KV02
23284	Đăk Cấm	\N	51	KV03
23293	Kon Tum	\N	51	KV03
23302	Đăk Bla	\N	51	KV01
23317	Ngọk Bay	\N	51	KV02
23326	Ia Chim	\N	51	KV03
23332	Đăk Rơ Wa	\N	51	KV02
23341	Đăk Pék	\N	51	KV03
23344	Đăk Plô	\N	51	KV02
23356	Xốp	\N	51	KV03
23365	Ngọc Linh	\N	51	KV01
23368	Đăk Long	\N	51	KV01
23374	Đăk Môn	\N	51	KV01
23377	Bờ Y	\N	51	KV03
23383	Dục Nông	\N	51	KV01
23392	Sa Loong	\N	51	KV01
23401	Đăk Tô	\N	51	KV02
23416	Đăk Sao	\N	51	KV02
23419	Đăk Tờ Kan	\N	51	KV02
23425	Tu Mơ Rông	\N	51	KV03
23428	Ngọk Tụ	\N	51	KV03
23430	Kon Đào	\N	51	KV03
23446	Măng Ri	\N	51	KV03
23455	Măng Bút	\N	51	KV03
23473	Măng Đen	\N	51	KV03
23476	Kon Plông	\N	51	KV02
23479	Đăk Rve	\N	51	KV03
23485	Đăk Kôi	\N	51	KV01
23497	Kon Braih	\N	51	KV02
23500	Đăk Hà	\N	51	KV01
23504	Đăk Pxi	\N	51	KV02
23510	Đăk Ui	\N	51	KV01
23512	Đăk Mar	\N	51	KV02
23515	Ngọk Réo	\N	51	KV02
23527	Sa Thầy	\N	51	KV03
23530	Rờ Kơi	\N	51	KV01
23534	Sa Bình	\N	51	KV03
23535	Ia Đal	\N	51	KV03
23536	Mô Rai	\N	51	KV02
23538	Ia Tơi	\N	51	KV03
23548	Ya Ly	\N	51	KV02
21553	Quy Nhơn Bắc	\N	52	KV01
21583	Quy Nhơn	\N	52	KV01
21589	Quy Nhơn Tây	\N	52	KV03
21592	Quy Nhơn Nam	\N	52	KV01
21601	Quy Nhơn Đông	\N	52	KV01
21607	Nhơn Châu	\N	52	KV01
21609	An Lão	\N	52	KV01
21616	An Vinh	\N	52	KV02
21622	An Toàn	\N	52	KV01
21628	An Hòa	\N	52	KV01
21637	Tam Quan	\N	52	KV01
21640	Bồng Sơn	\N	52	KV02
21655	Hoài Nhơn Bắc	\N	52	KV01
21661	Hoài Nhơn Tây	\N	52	KV03
21664	Hoài Nhơn	\N	52	KV03
21670	Hoài Nhơn Đông	\N	52	KV03
21673	Hoài Nhơn Nam	\N	52	KV03
21688	Hoài Ân	\N	52	KV03
21697	Ân Hảo	\N	52	KV01
21703	Vạn Đức	\N	52	KV03
21715	Ân Tường	\N	52	KV02
21727	Kim Sơn	\N	52	KV02
21730	Phù Mỹ	\N	52	KV02
21733	Bình Dương	\N	52	KV01
21739	Phù Mỹ Bắc	\N	52	KV02
21751	Phù Mỹ Đông	\N	52	KV01
21757	Phù Mỹ Tây	\N	52	KV02
21769	An Lương	\N	52	KV01
21775	Phù Mỹ Nam	\N	52	KV03
21786	Vĩnh Thạnh	\N	52	KV01
21787	Vĩnh Sơn	\N	52	KV02
21796	Vĩnh Thịnh	\N	52	KV02
21805	Vĩnh Quang	\N	52	KV02
21808	Tây Sơn	\N	52	KV01
21817	Bình Hiệp	\N	52	KV03
21820	Bình Khê	\N	52	KV02
21829	Bình An	\N	52	KV01
21835	Bình Phú	\N	52	KV02
21853	Phù Cát	\N	52	KV02
21859	Đề Gi	\N	52	KV03
21868	Hội Sơn	\N	52	KV03
21871	Hòa Hội	\N	52	KV01
21880	Cát Tiến	\N	52	KV02
21892	Xuân An	\N	52	KV01
21901	Ngô Mây	\N	52	KV03
21907	Bình Định	\N	52	KV03
21910	An Nhơn	\N	52	KV03
21925	An Nhơn Bắc	\N	52	KV03
21934	An Nhơn Đông	\N	52	KV02
21940	An Nhơn Tây	\N	52	KV03
21943	An Nhơn Nam	\N	52	KV02
21952	Tuy Phước	\N	52	KV01
21964	Tuy Phước Bắc	\N	52	KV01
21970	Tuy Phước Đông	\N	52	KV02
21985	Tuy Phước Tây	\N	52	KV01
21994	Vân Canh	\N	52	KV01
21997	Canh Liên	\N	52	KV03
22006	Canh Vinh	\N	52	KV03
23563	Diên Hồng	\N	52	KV02
23575	Pleiku	\N	52	KV03
23584	Thống Nhất	\N	52	KV02
23586	Hội Phú	\N	52	KV02
23590	Biển Hồ	\N	52	KV03
23602	An Phú	\N	52	KV03
23611	Gào	\N	52	KV01
23614	An Bình	\N	52	KV02
23617	An Khê	\N	52	KV02
23629	Cửu An	\N	52	KV03
23638	Kbang	\N	52	KV01
23644	Đak Rong	\N	52	KV01
23647	Sơn Lang	\N	52	KV02
23650	Krong	\N	52	KV01
23668	Tơ Tung	\N	52	KV02
23674	Kông Bơ La	\N	52	KV02
23677	Đak Đoa	\N	52	KV02
23683	Đak Sơmei	\N	52	KV02
23701	Kon Gang	\N	52	KV03
23710	Ia Băng	\N	52	KV01
23714	KDang	\N	52	KV01
23722	Chư Păh	\N	52	KV03
23728	Ia Khươl	\N	52	KV02
23734	Ia Ly	\N	52	KV02
23749	Ia Phí	\N	52	KV01
23764	Ia Grai	\N	52	KV03
23767	Ia Hrung	\N	52	KV02
23776	Ia Krái	\N	52	KV01
23782	Ia O	\N	52	KV03
23788	Ia Chia	\N	52	KV01
23794	Mang Yang	\N	52	KV01
23798	Ayun	\N	52	KV02
23799	Hra	\N	52	KV01
23812	Lơ Pang	\N	52	KV02
23818	Kon Chiêng	\N	52	KV01
23824	Kông Chro	\N	52	KV02
23830	Chư Krey	\N	52	KV03
23833	Ya Ma	\N	52	KV03
23839	SRó	\N	52	KV03
23842	Đăk Song	\N	52	KV01
23851	Chơ Long	\N	52	KV01
23857	Đức Cơ	\N	52	KV03
23866	Ia Krêl	\N	52	KV03
23869	Ia Dơk	\N	52	KV03
23872	Ia Dom	\N	52	KV02
23881	Ia Pnôn	\N	52	KV03
23884	Ia Nan	\N	52	KV01
23887	Chư Prông	\N	52	KV03
23896	Bàu Cạn	\N	52	KV01
23908	Ia Tôr	\N	52	KV02
23911	Ia Boòng	\N	52	KV02
23917	Ia Púch	\N	52	KV02
23926	Ia Pia	\N	52	KV01
23935	Ia Lâu	\N	52	KV02
23938	Ia Mơ	\N	52	KV01
23941	Chư Sê	\N	52	KV03
23942	Chư Pưh	\N	52	KV01
23947	Bờ Ngoong	\N	52	KV01
23954	Al Bá	\N	52	KV02
23971	Ia Hrú	\N	52	KV01
23977	Ia Ko	\N	52	KV02
23986	Ia Le	\N	52	KV01
23995	Đak Pơ	\N	52	KV03
24007	Ya Hội	\N	52	KV03
24013	Pờ Tó	\N	52	KV03
24022	Ia Pa	\N	52	KV02
24028	Ia Tul	\N	52	KV03
24043	Phú Thiện	\N	52	KV01
24044	Ayun Pa	\N	52	KV03
24049	Chư A Thai	\N	52	KV01
24061	Ia Hiao	\N	52	KV01
24065	Ia Rbol	\N	52	KV03
24073	Ia Sao	\N	52	KV02
24076	Phú Túc	\N	52	KV01
24100	Ia Dreh	\N	52	KV03
24109	Uar	\N	52	KV02
24112	Ia Rsai	\N	52	KV01
22333	Bắc Nha Trang	\N	56	KV02
22366	Nha Trang	\N	56	KV01
22390	Tây Nha Trang	\N	56	KV01
22402	Nam Nha Trang	\N	56	KV03
22411	Bắc Cam Ranh	\N	56	KV01
22420	Cam Ranh	\N	56	KV02
22423	Ba Ngòi	\N	56	KV01
22432	Cam Linh	\N	56	KV02
22435	Cam Hiệp	\N	56	KV01
22453	Cam Lâm	\N	56	KV02
22465	Cam An	\N	56	KV01
22480	Nam Cam Ranh	\N	56	KV03
22489	Vạn Ninh	\N	56	KV01
22498	Tu Bông	\N	56	KV01
22504	Đại Lãnh	\N	56	KV03
22516	Vạn Thắng	\N	56	KV03
22525	Vạn Hưng	\N	56	KV02
22528	Ninh Hòa	\N	56	KV03
22546	Bắc Ninh Hòa	\N	56	KV02
22552	Tây Ninh Hòa	\N	56	KV02
22558	Hòa Trí	\N	56	KV03
22561	Đông Ninh Hòa	\N	56	KV02
22576	Tân Định	\N	56	KV02
22591	Hòa Thắng	\N	56	KV01
22597	Nam Ninh Hòa	\N	56	KV02
22609	Khánh Vĩnh	\N	56	KV03
22612	Trung Khánh Vĩnh	\N	56	KV01
22615	Bắc Khánh Vĩnh	\N	56	KV02
22624	Tây Khánh Vĩnh	\N	56	KV01
22648	Nam Khánh Vĩnh	\N	56	KV01
22651	Diên Khánh	\N	56	KV03
22657	Diên Điền	\N	56	KV01
22660	Diên Lâm	\N	56	KV02
22672	Diên Thọ	\N	56	KV01
22678	Diên Lạc	\N	56	KV02
22702	Suối Hiệp	\N	56	KV02
22708	Suối Dầu	\N	56	KV02
22714	Khánh Sơn	\N	56	KV01
22720	Tây Khánh Sơn	\N	56	KV01
22732	Đông Khánh Sơn	\N	56	KV02
22736	Đặc khu Trường Sa	\N	56	KV02
22738	Đô Vinh	\N	56	KV01
22741	Bảo An	\N	56	KV03
22759	Phan Rang	\N	56	KV03
22780	Đông Hải	\N	56	KV02
22786	Bác Ái Tây	\N	56	KV01
22795	Bác Ái	\N	56	KV02
22801	Bác Ái Đông	\N	56	KV03
22810	Ninh Sơn	\N	56	KV03
22813	Lâm Sơn	\N	56	KV01
22822	Mỹ Sơn	\N	56	KV01
22828	Anh Dũng	\N	56	KV02
22834	Ninh Chử	\N	56	KV02
22840	Công Hải	\N	56	KV03
22846	Vĩnh Hải	\N	56	KV02
22849	Thuận Bắc	\N	56	KV03
22852	Ninh Hải	\N	56	KV01
22861	Xuân Hải	\N	56	KV03
22870	Ninh Phước	\N	56	KV02
22873	Phước Hậu	\N	56	KV02
22888	Phước Dinh	\N	56	KV02
22891	Phước Hữu	\N	56	KV03
22897	Thuận Nam	\N	56	KV03
22900	Phước Hà	\N	56	KV01
22909	Cà Ná	\N	56	KV02
22015	Tuy Hòa	\N	66	KV02
22045	Bình Kiến	\N	66	KV01
22051	Sông Cầu	\N	66	KV01
22057	Xuân Lộc	\N	66	KV03
22060	Xuân Cảnh	\N	66	KV01
22075	Xuân Thọ	\N	66	KV02
22076	Xuân Đài	\N	66	KV02
22081	Đồng Xuân	\N	66	KV02
22090	Xuân Lãnh	\N	66	KV02
22096	Phú Mỡ	\N	66	KV02
22111	Xuân Phước	\N	66	KV02
22114	Tuy An Bắc	\N	66	KV01
22120	Tuy An Đông	\N	66	KV02
22132	Tuy An Tây	\N	66	KV01
22147	Ô Loan	\N	66	KV03
22153	Tuy An Nam	\N	66	KV02
22165	Sơn Hòa	\N	66	KV03
22171	Tây Sơn	\N	66	KV03
22177	Vân Hòa	\N	66	KV01
22192	Suối Trai	\N	66	KV03
22207	Sông Hinh	\N	66	KV01
22222	Đức Bình	\N	66	KV02
22225	Ea Bá	\N	66	KV03
22237	Ea Ly	\N	66	KV03
22240	Phú Yên	\N	66	KV03
22250	Sơn Thành	\N	66	KV03
22255	Tây Hòa	\N	66	KV03
22258	Đông Hòa	\N	66	KV03
22261	Hòa Hiệp	\N	66	KV01
22276	Hòa Thịnh	\N	66	KV02
22285	Hòa Mỹ	\N	66	KV02
22291	Hòa Xuân	\N	66	KV01
22303	Phú Hòa 2	\N	66	KV03
22319	Phú Hòa 1	\N	66	KV03
24121	Tân Lập	\N	66	KV01
24133	Buôn Ma Thuột	\N	66	KV02
24154	Thành Nhất	\N	66	KV03
24163	Tân An	\N	66	KV03
24169	Ea Kao	\N	66	KV02
24175	Hòa Phú	\N	66	KV02
24181	Ea Drăng	\N	66	KV01
24184	Ea H’Leo	\N	66	KV03
24187	Ea Hiao	\N	66	KV03
24193	Ea Wy	\N	66	KV02
24208	Ea Khăl	\N	66	KV03
24211	Ea Súp	\N	66	KV02
24214	Ia Lốp	\N	66	KV02
24217	Ea Rốk	\N	66	KV01
24221	Ia Rvê	\N	66	KV03
24229	Ea Bung	\N	66	KV02
24235	Buôn Đôn	\N	66	KV02
24241	Ea Wer	\N	66	KV02
24250	Ea Nuôl	\N	66	KV03
24259	Quảng Phú	\N	66	KV03
24265	Ea Kiết	\N	66	KV03
24277	Ea Tul	\N	66	KV02
24280	Cư M’gar	\N	66	KV03
24286	Ea M’Droh	\N	66	KV03
24301	Cuôr Đăng	\N	66	KV03
24305	Buôn Hồ	\N	66	KV02
24310	Krông Búk	\N	66	KV02
24313	Cư Pơng	\N	66	KV01
24316	Pơng Drang	\N	66	KV03
24328	Ea Drông	\N	66	KV01
24340	Cư Bao	\N	66	KV03
24343	Krông Năng	\N	66	KV02
24346	Dliê Ya	\N	66	KV02
24352	Tam Giang	\N	66	KV03
24364	Phú Xuân	\N	66	KV01
24373	Ea Kar	\N	66	KV01
24376	Ea Knốp	\N	66	KV01
24400	Ea Păl	\N	66	KV03
24403	Ea Ô	\N	66	KV02
24406	Cư Yang	\N	66	KV03
24412	M’Drắk	\N	66	KV02
24415	Cư Prao	\N	66	KV03
24433	Ea Riêng	\N	66	KV02
24436	Cư M’ta	\N	66	KV01
24444	Krông Á	\N	66	KV02
24445	Ea Trang	\N	66	KV01
24448	Krông Bông	\N	66	KV01
24454	Dang Kang	\N	66	KV01
24472	Hòa Sơn	\N	66	KV02
24478	Cư Pui	\N	66	KV02
24484	Yang Mao	\N	66	KV02
24490	Krông Pắc	\N	66	KV02
24496	Ea Kly	\N	66	KV03
24502	Ea Phê	\N	66	KV03
24505	Ea Knuếc	\N	66	KV02
24526	Tân Tiến	\N	66	KV03
24529	Vụ Bổn	\N	66	KV01
24538	Krông Ana	\N	66	KV01
24540	Ea Ning	\N	66	KV01
24544	Ea Ktur	\N	66	KV02
24559	Ea Na	\N	66	KV02
24561	Dray Bhăng	\N	66	KV03
24568	Dur Kmăl	\N	66	KV02
24580	Liên Sơn Lắk	\N	66	KV02
24595	Đắk Liêng	\N	66	KV03
24598	Đắk Phơi	\N	66	KV02
24604	Krông Nô	\N	66	KV02
24607	Nam Ka	\N	66	KV03
22918	Mũi Né	\N	68	KV02
22924	Phú Thuỷ	\N	68	KV02
22933	Hàm Thắng	\N	68	KV02
22945	Phan Thiết	\N	68	KV02
22954	Tiến Thành	\N	68	KV01
22960	Bình Thuận	\N	68	KV03
22963	Tuyên Quang	\N	68	KV03
22969	Liên Hương	\N	68	KV03
22972	Phan Rí Cửa	\N	68	KV02
22978	Tuy Phong	\N	68	KV01
22981	Vĩnh Hảo	\N	68	KV02
23005	Bắc Bình	\N	68	KV02
23008	Phan Sơn	\N	68	KV02
23020	Hải Ninh	\N	68	KV01
23023	Sông Lũy	\N	68	KV02
23032	Lương Sơn	\N	68	KV03
23041	Hồng Thái	\N	68	KV01
23053	Hòa Thắng	\N	68	KV02
23059	Hàm Thuận	\N	68	KV01
23065	La Dạ	\N	68	KV03
23074	Đông Giang	\N	68	KV03
23086	Hồng Sơn	\N	68	KV02
23089	Hàm Thuận Bắc	\N	68	KV01
23095	Hàm Liêm	\N	68	KV01
23110	Hàm Thuận Nam	\N	68	KV02
23122	Hàm Thạnh	\N	68	KV01
23128	Hàm Kiệm	\N	68	KV02
23134	Tân Lập	\N	68	KV02
23143	Tân Thành	\N	68	KV02
23149	Tánh Linh	\N	68	KV02
23152	Bắc Ruộng	\N	68	KV01
23158	Nghị Đức	\N	68	KV02
23173	Đồng Kho	\N	68	KV01
23188	Suối Kiết	\N	68	KV02
23191	Đức Linh	\N	68	KV03
23194	Hoài Đức	\N	68	KV02
23200	Nam Thành	\N	68	KV02
23227	Trà Tân	\N	68	KV01
23230	Tân Minh	\N	68	KV01
23231	Phước Hội	\N	68	KV01
23235	La Gi	\N	68	KV03
23236	Hàm Tân	\N	68	KV01
23246	Tân Hải	\N	68	KV03
23266	Sơn Mỹ	\N	68	KV01
23272	Đặc khu Phú Quý	\N	68	KV01
24611	Bắc Gia Nghĩa	\N	68	KV01
24615	Nam Gia Nghĩa	\N	68	KV02
24616	Quảng Sơn	\N	68	KV03
24617	Đông Gia Nghĩa	\N	68	KV01
24620	Quảng Hòa	\N	68	KV02
24631	Quảng Khê	\N	68	KV02
24637	Tà Đùng	\N	68	KV01
24640	Cư Jút	\N	68	KV03
24646	Đắk Wil	\N	68	KV03
24649	Nam Dong	\N	68	KV02
24664	Đức Lập	\N	68	KV01
24670	Đắk Mil	\N	68	KV01
24678	Đắk Sắk	\N	68	KV02
24682	Thuận An	\N	68	KV01
24688	Krông Nô	\N	68	KV03
24697	Nam Đà	\N	68	KV03
24703	Nâm Nung	\N	68	KV01
24712	Quảng Phú	\N	68	KV02
24717	Đức An	\N	68	KV01
24718	Đắk Song	\N	68	KV03
24722	Thuận Hạnh	\N	68	KV02
24730	Trường Xuân	\N	68	KV03
24733	Kiến Đức	\N	68	KV03
24736	Quảng Trực	\N	68	KV03
24739	Tuy Đức	\N	68	KV01
24748	Quảng Tân	\N	68	KV02
24751	Nhân Cơ	\N	68	KV02
24760	Quảng Tín	\N	68	KV01
24778	Lâm Viên - Đà Lạt	\N	68	KV03
24781	Xuân Hương - Đà Lạt	\N	68	KV03
24787	Cam Ly - Đà Lạt	\N	68	KV01
24805	Xuân Trường - Đà Lạt	\N	68	KV03
24820	2 Bảo Lộc	\N	68	KV01
24823	1 Bảo Lộc	\N	68	KV01
24829	B’Lao	\N	68	KV03
24841	3 Bảo Lộc	\N	68	KV01
24846	Lang Biang - Đà Lạt	\N	68	KV01
24848	Lạc Dương	\N	68	KV03
24853	Đam Rông 4	\N	68	KV02
24868	Nam Ban Lâm Hà	\N	68	KV03
24871	Đinh Văn Lâm Hà	\N	68	KV01
24875	Đam Rông 3	\N	68	KV02
24877	Đam Rông 2	\N	68	KV02
24883	Nam Hà Lâm Hà	\N	68	KV03
24886	Đam Rông 1	\N	68	KV03
24895	Phú Sơn Lâm Hà	\N	68	KV01
24907	Phúc Thọ Lâm Hà	\N	68	KV02
24916	Tân Hà Lâm Hà	\N	68	KV02
24931	Đơn Dương	\N	68	KV02
24934	D’Ran	\N	68	KV03
24943	Ka Đô	\N	68	KV02
24955	Quảng Lập	\N	68	KV03
24958	Đức Trọng	\N	68	KV03
24967	Hiệp Thạnh	\N	68	KV01
24976	Tân Hội	\N	68	KV01
24985	Ninh Gia	\N	68	KV01
24988	Tà Năng	\N	68	KV03
24991	Tà Hine	\N	68	KV02
25000	Di Linh	\N	68	KV02
25007	Đinh Trang Thượng	\N	68	KV03
25015	Gia Hiệp	\N	68	KV01
25018	Bảo Thuận	\N	68	KV02
25036	Hòa Ninh	\N	68	KV03
25042	Hòa Bắc	\N	68	KV03
25051	Sơn Điền	\N	68	KV03
25054	Bảo Lâm 1	\N	68	KV03
25057	Bảo Lâm 5	\N	68	KV03
25063	Bảo Lâm 4	\N	68	KV02
25084	Bảo Lâm 2	\N	68	KV01
25093	Bảo Lâm 3	\N	68	KV01
25099	Đạ Huoai	\N	68	KV03
25105	Đạ Huoai 2	\N	68	KV02
25114	Đạ Huoai 3	\N	68	KV03
25126	Đạ Tẻh	\N	68	KV01
25135	Đạ Tẻh 3	\N	68	KV02
25138	Đạ Tẻh 2	\N	68	KV03
25159	Cát Tiên	\N	68	KV01
25162	Cát Tiên 3	\N	68	KV02
25180	Cát Tiên 2	\N	68	KV01
25195	Bình Phước	\N	75	KV02
25210	Đồng Xoài	\N	75	KV01
25217	Phước Long	\N	75	KV03
25220	Phước Bình	\N	75	KV02
25222	Bù Gia Mập	\N	75	KV01
25225	Đăk Ơ	\N	75	KV03
25231	Đa Kia	\N	75	KV01
25246	Bình Tân	\N	75	KV01
25252	Phú Riềng	\N	75	KV01
25255	Long Hà	\N	75	KV02
25261	Phú Trung	\N	75	KV02
25267	Phú Nghĩa	\N	75	KV02
25270	Lộc Ninh	\N	75	KV01
25279	Lộc Tấn	\N	75	KV03
25280	Lộc Thạnh	\N	75	KV02
25292	Lộc Quang	\N	75	KV02
25294	Lộc Thành	\N	75	KV03
25303	Lộc Hưng	\N	75	KV01
25308	Thiện Hưng	\N	75	KV03
25309	Hưng Phước	\N	75	KV02
25318	Tân Tiến	\N	75	KV03
25326	Bình Long	\N	75	KV01
25333	An Lộc	\N	75	KV03
25345	Tân Hưng	\N	75	KV03
25349	Minh Đức	\N	75	KV03
25351	Tân Quan	\N	75	KV03
25357	Tân Khai	\N	75	KV01
25363	Đồng Phú	\N	75	KV03
25378	Tân Lợi	\N	75	KV02
25387	Thuận Lợi	\N	75	KV01
25390	Đồng Tâm	\N	75	KV02
25396	Bù Đăng	\N	75	KV01
25399	Đak Nhau	\N	75	KV01
25402	Thọ Sơn	\N	75	KV02
25405	Bom Bo	\N	75	KV01
25417	Nghĩa Trung	\N	75	KV01
25420	Phước Sơn	\N	75	KV02
25432	Chơn Thành	\N	75	KV03
25441	Minh Hưng	\N	75	KV03
25450	Nha Bích	\N	75	KV02
25993	Trảng Dài	\N	75	KV02
26005	Hố Nai	\N	75	KV01
26017	Tam Hiệp	\N	75	KV02
26020	Long Bình	\N	75	KV03
26041	Trấn Biên	\N	75	KV02
26068	Biên Hòa	\N	75	KV02
26080	Long Khánh	\N	75	KV02
26089	Bình Lộc	\N	75	KV02
26098	Bảo Vinh	\N	75	KV02
26104	Xuân Lập	\N	75	KV03
26113	Hàng Gòn	\N	75	KV03
26116	Tân Phú	\N	75	KV01
26119	Đak Lua	\N	75	KV02
26122	Nam Cát Tiên	\N	75	KV01
26134	Tà Lài	\N	75	KV02
26158	Phú Lâm	\N	75	KV02
26170	Trị An	\N	75	KV02
26173	Phú Lý	\N	75	KV01
26179	Tân An	\N	75	KV02
26188	Tân Triều	\N	75	KV03
26206	Định Quán	\N	75	KV02
26209	Thanh Sơn	\N	75	KV01
26215	Phú Vinh	\N	75	KV02
26221	Phú Hòa	\N	75	KV03
26227	La Ngà	\N	75	KV03
26248	Trảng Bom	\N	75	KV02
26254	Bàu Hàm	\N	75	KV03
26278	Bình Minh	\N	75	KV03
26281	Hưng Thịnh	\N	75	KV02
26296	An Viễn	\N	75	KV02
26299	Thống Nhất	\N	75	KV01
26311	Gia Kiệm	\N	75	KV01
26326	Dầu Giây	\N	75	KV03
26332	Xuân Quế	\N	75	KV01
26341	Cẩm Mỹ	\N	75	KV02
26347	Xuân Đường	\N	75	KV03
26359	Xuân Đông	\N	75	KV02
26362	Sông Ray	\N	75	KV01
26368	Long Thành	\N	75	KV01
26374	Tam Phước	\N	75	KV03
26377	Phước Tân	\N	75	KV01
26380	Long Hưng	\N	75	KV01
26383	An Phước	\N	75	KV01
26389	Bình An	\N	75	KV01
26413	Long Phước	\N	75	KV01
26422	Phước Thái	\N	75	KV01
26425	Xuân Lộc	\N	75	KV02
26428	Xuân Bắc	\N	75	KV03
26434	Xuân Thành	\N	75	KV03
26446	Xuân Hòa	\N	75	KV02
26458	Xuân Phú	\N	75	KV03
26461	Xuân Định	\N	75	KV03
26485	Nhơn Trạch	\N	75	KV03
26491	Đại Phước	\N	75	KV03
26503	Phước An	\N	75	KV01
25747	Thủ Dầu Một	\N	79	KV03
25750	Phú Lợi	\N	79	KV01
25760	Bình Dương	\N	79	KV03
25768	Phú An	\N	79	KV01
25771	Chánh Hiệp	\N	79	KV03
25777	Dầu Tiếng	\N	79	KV01
25780	Minh Thạnh	\N	79	KV01
25792	Long Hòa	\N	79	KV01
25807	Thanh An	\N	79	KV02
25813	Bến Cát	\N	79	KV03
25819	Trừ Văn Thố	\N	79	KV02
25822	Bàu Bàng	\N	79	KV02
25837	Chánh Phú Hòa	\N	79	KV02
25840	Long Nguyên	\N	79	KV02
25843	Tây Nam	\N	79	KV03
25846	Thới Hòa	\N	79	KV03
25849	Hòa Lợi	\N	79	KV02
25858	Phú Giáo	\N	79	KV02
25864	Phước Thành	\N	79	KV03
25867	An Long	\N	79	KV02
25882	Phước Hòa	\N	79	KV03
25888	Tân Uyên	\N	79	KV02
25891	Tân Khánh	\N	79	KV01
25906	Bắc Tân Uyên	\N	79	KV01
25909	Thường Tân	\N	79	KV01
25912	Vĩnh Tân	\N	79	KV01
25915	Bình Cơ	\N	79	KV02
25920	Tân Hiệp	\N	79	KV02
25942	Dĩ An	\N	79	KV03
25945	Tân Đông Hiệp	\N	79	KV03
25951	Đông Hòa	\N	79	KV02
25966	Lái Thiêu	\N	79	KV03
25969	Thuận Giao	\N	79	KV01
25975	An Phú	\N	79	KV02
25978	Thuận An	\N	79	KV02
25987	Bình Hòa	\N	79	KV02
26506	Vũng Tàu	\N	79	KV03
26526	Tam Thắng	\N	79	KV03
26536	Rạch Dừa	\N	79	KV01
26542	Phước Thắng	\N	79	KV03
26545	Long Sơn	\N	79	KV01
26560	Bà Rịa	\N	79	KV03
26566	Long Hương	\N	79	KV02
26572	Tam Long	\N	79	KV02
26575	Ngãi Giao	\N	79	KV03
26584	Xuân Sơn	\N	79	KV03
26590	Bình Giã	\N	79	KV02
26596	Châu Đức	\N	79	KV03
26608	Kim Long	\N	79	KV02
26617	Nghĩa Thành	\N	79	KV02
26620	Hồ Tràm	\N	79	KV01
26632	Xuyên Mộc	\N	79	KV03
26638	Bàu Lâm	\N	79	KV03
26641	Hòa Hội	\N	79	KV01
26647	Hòa Hiệp	\N	79	KV03
26656	Bình Châu	\N	79	KV03
26659	Long Điền	\N	79	KV01
26662	Long Hải	\N	79	KV02
26680	Đất Đỏ	\N	79	KV02
26686	Phước Hải	\N	79	KV01
26704	Phú Mỹ	\N	79	KV02
26710	Tân Hải	\N	79	KV01
26713	Tân Phước	\N	79	KV01
26725	Tân Thành	\N	79	KV01
26728	Châu Pha	\N	79	KV02
26732	Đặc khu Côn Đảo	\N	79	KV02
26737	Tân Định	\N	79	KV03
26740	Sài Gòn	\N	79	KV01
26743	Bến Thành	\N	79	KV03
26758	Cầu Ông Lãnh	\N	79	KV01
26767	An Phú Đông	\N	79	KV03
26773	Thới An	\N	79	KV03
26782	Tân Thới Hiệp	\N	79	KV02
26785	Trung Mỹ Tây	\N	79	KV02
26791	Đông Hưng Thuận	\N	79	KV01
26800	Linh Xuân	\N	79	KV03
26803	Tam Bình	\N	79	KV01
26809	Hiệp Bình	\N	79	KV03
26824	Thủ Đức	\N	79	KV02
26833	Long Bình	\N	79	KV02
26842	Tăng Nhơn Phú	\N	79	KV02
26848	Phước Long	\N	79	KV01
26857	Long Phước	\N	79	KV02
26860	Long Trường	\N	79	KV03
26876	An Nhơn	\N	79	KV02
26878	An Hội Đông	\N	79	KV03
26882	An Hội Tây	\N	79	KV02
26884	Gò Vấp	\N	79	KV01
26890	Hạnh Thông	\N	79	KV03
26898	Thông Tây Hội	\N	79	KV01
26905	Bình Lợi Trung	\N	79	KV02
26911	Bình Quới	\N	79	KV02
26929	Bình Thạnh	\N	79	KV01
26944	Gia Định	\N	79	KV03
26956	Thạnh Mỹ Tây	\N	79	KV01
26968	Tân Sơn Nhất	\N	79	KV01
26977	Tân Sơn Hòa	\N	79	KV03
26983	Bảy Hiền	\N	79	KV02
26995	Tân Hòa	\N	79	KV02
27004	Tân Bình	\N	79	KV03
27007	Tân Sơn	\N	79	KV01
27013	Tây Thạnh	\N	79	KV01
27019	Tân Sơn Nhì	\N	79	KV03
27022	Phú Thọ Hòa	\N	79	KV02
27028	Phú Thạnh	\N	79	KV01
27031	Tân Phú	\N	79	KV03
27043	Đức Nhuận	\N	79	KV02
27058	Cầu Kiệu	\N	79	KV01
27073	Phú Nhuận	\N	79	KV02
27094	An Khánh	\N	79	KV01
27097	Bình Trưng	\N	79	KV03
27112	Cát Lái	\N	79	KV02
27139	Xuân Hòa	\N	79	KV02
27142	Nhiêu Lộc	\N	79	KV03
27154	Bàn Cờ	\N	79	KV03
27163	Hòa Hưng	\N	79	KV03
27169	Diên Hồng	\N	79	KV03
27190	Vườn Lài	\N	79	KV01
27211	Hòa Bình	\N	79	KV02
27226	Phú Thọ	\N	79	KV03
27232	Bình Thới	\N	79	KV03
27238	Minh Phụng	\N	79	KV02
27259	Xóm Chiếu	\N	79	KV02
27265	Khánh Hội	\N	79	KV03
27286	Vĩnh Hội	\N	79	KV01
27301	Chợ Quán	\N	79	KV01
27316	An Đông	\N	79	KV01
27343	Chợ Lớn	\N	79	KV01
27349	Phú Lâm	\N	79	KV01
27364	Bình Phú	\N	79	KV03
27367	Bình Tây	\N	79	KV02
27373	Bình Tiên	\N	79	KV03
27418	Chánh Hưng	\N	79	KV03
27424	Bình Đông	\N	79	KV02
27427	Phú Định	\N	79	KV01
27439	Bình Hưng Hòa	\N	79	KV03
27442	Bình Tân	\N	79	KV01
27448	Bình Trị Đông	\N	79	KV01
27457	Tân Tạo	\N	79	KV03
27460	An Lạc	\N	79	KV02
27475	Tân Hưng	\N	79	KV02
27478	Tân Thuận	\N	79	KV02
27484	Phú Thuận	\N	79	KV01
27487	Tân Mỹ	\N	79	KV01
27496	Tân An Hội	\N	79	KV02
27508	An Nhơn Tây	\N	79	KV02
27511	Nhuận Đức	\N	79	KV03
27526	Thái Mỹ	\N	79	KV01
27541	Phú Hòa Đông	\N	79	KV03
27544	Bình Mỹ	\N	79	KV01
27553	Củ Chi	\N	79	KV02
27559	Hóc Môn	\N	79	KV03
27568	Đông Thạnh	\N	79	KV02
27577	Xuân Thới Sơn	\N	79	KV01
27592	Bà Điểm	\N	79	KV03
27595	Tân Nhựt	\N	79	KV03
27601	Vĩnh Lộc	\N	79	KV03
27604	Tân Vĩnh Lộc	\N	79	KV01
27610	Bình Lợi	\N	79	KV03
27619	Bình Hưng	\N	79	KV03
27628	Hưng Long	\N	79	KV02
27637	Bình Chánh	\N	79	KV01
27655	Nhà Bè	\N	79	KV02
27658	Hiệp Phước	\N	79	KV01
27664	Cần Giờ	\N	79	KV02
27667	Bình Khánh	\N	79	KV01
27673	An Thới Đông	\N	79	KV01
27676	Thạnh An	\N	79	KV02
25459	Tân Ninh	\N	80	KV02
25480	Bình Minh	\N	80	KV02
25486	Tân Biên	\N	80	KV01
25489	Tân Lập	\N	80	KV01
25498	Thạnh Bình	\N	80	KV02
25510	Trà Vong	\N	80	KV03
25516	Tân Châu	\N	80	KV03
25522	Tân Đông	\N	80	KV03
25525	Tân Hội	\N	80	KV03
25531	Tân Hòa	\N	80	KV03
25534	Tân Thành	\N	80	KV02
25549	Tân Phú	\N	80	KV02
25552	Dương Minh Châu	\N	80	KV01
25567	Ninh Thạnh	\N	80	KV02
25573	Cầu Khởi	\N	80	KV01
25579	Lộc Ninh	\N	80	KV01
25585	Châu Thành	\N	80	KV01
25588	Hảo Đước	\N	80	KV01
25591	Phước Vinh	\N	80	KV03
25606	Hòa Hội	\N	80	KV02
25621	Ninh Điền	\N	80	KV02
25630	Long Hoa	\N	80	KV03
25633	Thanh Điền	\N	80	KV01
25645	Hòa Thành	\N	80	KV02
25654	Gò Dầu	\N	80	KV03
25657	Thạnh Đức	\N	80	KV01
25663	Phước Thạnh	\N	80	KV03
25666	Truông Mít	\N	80	KV02
25672	Gia Lộc	\N	80	KV03
25681	Bến Cầu	\N	80	KV03
25684	Long Chữ	\N	80	KV03
25702	Long Thuận	\N	80	KV01
25708	Trảng Bàng	\N	80	KV01
25711	Hưng Thuận	\N	80	KV01
25729	Phước Chỉ	\N	80	KV02
25732	An Tịnh	\N	80	KV03
27694	Long An	\N	80	KV03
27712	Tân An	\N	80	KV02
27715	Khánh Hậu	\N	80	KV02
27721	Tân Hưng	\N	80	KV03
27727	Hưng Điền	\N	80	KV01
27736	Vĩnh Thạnh	\N	80	KV02
27748	Vĩnh Châu	\N	80	KV03
27757	Vĩnh Hưng	\N	80	KV01
27763	Khánh Hưng	\N	80	KV03
27775	Tuyên Bình	\N	80	KV02
27787	Kiến Tường	\N	80	KV03
27793	Bình Hiệp	\N	80	KV02
27811	Bình Hòa	\N	80	KV02
27817	Tuyên Thạnh	\N	80	KV01
27823	Mộc Hóa	\N	80	KV03
27826	Tân Thạnh	\N	80	KV02
27838	Nhơn Hòa Lập	\N	80	KV02
27841	Hậu Thạnh	\N	80	KV03
27856	Nhơn Ninh	\N	80	KV03
27865	Thạnh Hóa	\N	80	KV03
27868	Bình Thành	\N	80	KV03
27877	Thạnh Phước	\N	80	KV02
27889	Tân Tây	\N	80	KV03
27898	Đông Thành	\N	80	KV01
27907	Mỹ Quý	\N	80	KV03
27925	Đức Huệ	\N	80	KV03
27931	Hậu Nghĩa	\N	80	KV01
27937	Đức Hòa	\N	80	KV01
27943	An Ninh	\N	80	KV02
27952	Hiệp Hòa	\N	80	KV02
27964	Đức Lập	\N	80	KV03
27976	Mỹ Hạnh	\N	80	KV01
27979	Hòa Khánh	\N	80	KV01
27991	Bến Lức	\N	80	KV03
27994	Thạnh Lợi	\N	80	KV02
28003	Lương Hòa	\N	80	KV01
28015	Bình Đức	\N	80	KV03
28018	Mỹ Yên	\N	80	KV03
28036	Thủ Thừa	\N	80	KV01
28051	Mỹ Thạnh	\N	80	KV03
28066	Mỹ An	\N	80	KV01
28072	Tân Long	\N	80	KV01
28075	Tân Trụ	\N	80	KV02
28087	Nhựt Tảo	\N	80	KV01
28093	Vàm Cỏ	\N	80	KV02
28108	Cần Đước	\N	80	KV01
28114	Rạch Kiến	\N	80	KV03
28126	Long Cang	\N	80	KV02
28132	Mỹ Lệ	\N	80	KV02
28138	Tân Lân	\N	80	KV03
28144	Long Hựu	\N	80	KV03
28159	Cần Giuộc	\N	80	KV01
28165	Phước Lý	\N	80	KV01
28177	Mỹ Lộc	\N	80	KV03
28201	Phước Vĩnh Tây	\N	80	KV01
28207	Tân Tập	\N	80	KV01
28210	Tầm Vu	\N	80	KV03
28222	Vĩnh Công	\N	80	KV01
28225	Thuận Mỹ	\N	80	KV02
28243	An Lục Long	\N	80	KV01
28249	Đạo Thạnh	\N	82	KV03
28261	Mỹ Tho	\N	82	KV02
28270	Thới Sơn	\N	82	KV01
28273	Mỹ Phong	\N	82	KV01
28285	Trung An	\N	82	KV03
28297	Long Thuận	\N	82	KV03
28306	Gò Công	\N	82	KV02
28315	Bình Xuân	\N	82	KV02
28321	Tân Phước 1	\N	82	KV01
28327	Tân Phước 2	\N	82	KV03
28336	Hưng Thạnh	\N	82	KV02
28345	Tân Phước 3	\N	82	KV02
28360	Cái Bè	\N	82	KV02
28366	Hậu Mỹ	\N	82	KV02
28378	Mỹ Thiện	\N	82	KV02
28393	Hội Cư	\N	82	KV01
28405	Mỹ Đức Tây	\N	82	KV03
28414	Mỹ Lợi	\N	82	KV03
28426	Thanh Hưng	\N	82	KV03
28429	An Hữu	\N	82	KV01
28435	Mỹ Phước Tây	\N	82	KV02
28436	Thanh Hòa	\N	82	KV03
28439	Cai Lậy	\N	82	KV03
28444	Thạnh Phú	\N	82	KV02
28456	Mỹ Thành	\N	82	KV02
28468	Tân Phú	\N	82	KV02
28471	Bình Phú	\N	82	KV03
28477	Nhị Quý	\N	82	KV01
28501	Hiệp Đức	\N	82	KV02
28504	Long Tiên	\N	82	KV03
28516	Ngũ Hiệp	\N	82	KV03
28519	Châu Thành	\N	82	KV01
28525	Tân Hương	\N	82	KV01
28537	Long Hưng	\N	82	KV03
28543	Long Định	\N	82	KV03
28564	Bình Trưng	\N	82	KV01
28576	Vĩnh Kim	\N	82	KV02
28582	Kim Sơn	\N	82	KV02
28594	Chợ Gạo	\N	82	KV03
28603	Mỹ Tịnh An	\N	82	KV03
28615	Lương Hòa Lạc	\N	82	KV03
28627	Tân Thuận Bình	\N	82	KV01
28633	An Thạnh Thủy	\N	82	KV03
28648	Bình Ninh	\N	82	KV01
28651	Vĩnh Bình	\N	82	KV03
28660	Đồng Sơn	\N	82	KV03
28663	Phú Thành	\N	82	KV02
28678	Vĩnh Hựu	\N	82	KV03
28687	Long Bình	\N	82	KV03
28693	Tân Thới	\N	82	KV02
28696	Tân Phú Đông	\N	82	KV03
28702	Tân Hòa	\N	82	KV01
28720	Gia Thuận	\N	82	KV02
28723	Tân Đông	\N	82	KV03
28729	Sơn Qui	\N	82	KV03
28738	Tân Điền	\N	82	KV03
28747	Gò Công Đông	\N	82	KV02
29869	Cao Lãnh	\N	82	KV01
29884	Mỹ Ngãi	\N	82	KV01
29888	Mỹ Trà	\N	82	KV02
29905	Sa Đéc	\N	82	KV02
29926	Tân Hồng	\N	82	KV03
29929	Tân Hộ Cơ	\N	82	KV02
29938	Tân Thành	\N	82	KV03
29944	An Phước	\N	82	KV03
29954	An Bình	\N	82	KV02
29955	Hồng Ngự	\N	82	KV03
29971	Thường Phước	\N	82	KV02
29978	Thường Lạc	\N	82	KV01
29983	Long Khánh	\N	82	KV01
29992	Long Phú Thuận	\N	82	KV03
30001	Tràm Chim	\N	82	KV01
30010	Tam Nông	\N	82	KV01
30019	An Hòa	\N	82	KV01
30025	Phú Cường	\N	82	KV01
30028	An Long	\N	82	KV02
30034	Phú Thọ	\N	82	KV02
30037	Tháp Mười	\N	82	KV01
30043	Phương Thịnh	\N	82	KV03
30046	Trường Xuân	\N	82	KV01
30055	Mỹ Quí	\N	82	KV01
30061	Đốc Binh Kiều	\N	82	KV03
30073	Thanh Mỹ	\N	82	KV01
30076	Mỹ Thọ	\N	82	KV03
30085	Ba Sao	\N	82	KV01
30088	Phong Mỹ	\N	82	KV02
30112	Mỹ Hiệp	\N	82	KV02
30118	Bình Hàng Trung	\N	82	KV01
30130	Thanh Bình	\N	82	KV03
30154	Tân Long	\N	82	KV02
30157	Tân Thạnh	\N	82	KV02
30163	Bình Thành	\N	82	KV02
30169	Lấp Vò	\N	82	KV03
30178	Mỹ An Hưng	\N	82	KV01
30184	Tân Khánh Trung	\N	82	KV03
30208	Hòa Long	\N	82	KV03
30214	Tân Dương	\N	82	KV01
30226	Lai Vung	\N	82	KV01
30235	Phong Hòa	\N	82	KV01
30244	Phú Hựu	\N	82	KV02
30253	Tân Nhuận Đông	\N	82	KV02
30259	Tân Phú Trung	\N	82	KV03
28756	Phú Khương	\N	86	KV01
28777	An Hội	\N	86	KV01
28783	Sơn Đông	\N	86	KV01
28789	Bến Tre	\N	86	KV01
28807	Giao Long	\N	86	KV03
28810	Phú Túc	\N	86	KV03
28840	Tân Phú	\N	86	KV01
28858	Phú Tân	\N	86	KV03
28861	Tiên Thủy	\N	86	KV03
28870	Chợ Lách	\N	86	KV01
28879	Phú Phụng	\N	86	KV01
28894	Vĩnh Thành	\N	86	KV02
28901	Hưng Khánh Trung	\N	86	KV01
28903	Mỏ Cày	\N	86	KV01
28915	Phước Mỹ Trung	\N	86	KV03
28921	Tân Thành Bình	\N	86	KV02
28945	Đồng Khởi	\N	86	KV01
28948	Nhuận Phú Tân	\N	86	KV01
28957	An Định	\N	86	KV01
28969	Thành Thới	\N	86	KV03
28981	Hương Mỹ	\N	86	KV03
28984	Giồng Trôm	\N	86	KV02
28987	Lương Hòa	\N	86	KV02
28993	Lương Phú	\N	86	KV02
28996	Châu Hòa	\N	86	KV01
29020	Phước Long	\N	86	KV01
29029	Tân Hào	\N	86	KV01
29044	Hưng Nhượng	\N	86	KV02
29050	Bình Đại	\N	86	KV01
29062	Phú Thuận	\N	86	KV02
29077	Lộc Thuận	\N	86	KV01
29083	Châu Hưng	\N	86	KV03
29089	Thạnh Trị	\N	86	KV02
29104	Thạnh Phước	\N	86	KV03
29107	Thới Thuận	\N	86	KV03
29110	Ba Tri	\N	86	KV01
29122	Mỹ Chánh Hòa	\N	86	KV02
29125	Bảo Thạnh	\N	86	KV03
29137	Tân Xuân	\N	86	KV01
29143	An Ngãi Trung	\N	86	KV02
29158	An Hiệp	\N	86	KV01
29167	Tân Thủy	\N	86	KV01
29182	Thạnh Phú	\N	86	KV01
29191	Quới Điền	\N	86	KV01
29194	Đại Điền	\N	86	KV02
29221	Thạnh Hải	\N	86	KV01
29224	An Qui	\N	86	KV02
29227	Thạnh Phong	\N	86	KV02
29242	Trà Vinh	\N	86	KV03
29254	Nguyệt Hóa	\N	86	KV03
29263	Long Đức	\N	86	KV02
29266	Càng Long	\N	86	KV03
29275	An Trường	\N	86	KV01
29278	Tân An	\N	86	KV03
29287	Bình Phú	\N	86	KV01
29302	Nhị Long	\N	86	KV01
29308	Cầu Kè	\N	86	KV01
29317	An Phú Tân	\N	86	KV01
29329	Phong Thạnh	\N	86	KV01
29335	Tam Ngãi	\N	86	KV02
29341	Tiểu Cần	\N	86	KV03
29362	Hùng Hòa	\N	86	KV02
29365	Tập Ngãi	\N	86	KV01
29371	Tân Hòa	\N	86	KV02
29374	Châu Thành	\N	86	KV03
29386	Song Lộc	\N	86	KV03
29398	Hòa Thuận	\N	86	KV01
29407	Hưng Mỹ	\N	86	KV03
29410	Hòa Minh	\N	86	KV03
29413	Long Hòa	\N	86	KV03
29416	Cầu Ngang	\N	86	KV03
29419	Mỹ Long	\N	86	KV02
29431	Vinh Kim	\N	86	KV03
29446	Nhị Trường	\N	86	KV01
29455	Hiệp Mỹ	\N	86	KV02
29461	Trà Cú	\N	86	KV03
29467	Tập Sơn	\N	86	KV01
29476	Lưu Nghiệp Anh	\N	86	KV02
29489	Hàm Giang	\N	86	KV01
29491	Đại An	\N	86	KV02
29497	Đôn Châu	\N	86	KV03
29506	Long Hiệp	\N	86	KV02
29512	Duyên Hải	\N	86	KV02
29513	Long Thành	\N	86	KV02
29516	Trường Long Hòa	\N	86	KV01
29518	Long Hữu	\N	86	KV01
29530	Ngũ Lạc	\N	86	KV01
29533	Long Vĩnh	\N	86	KV02
29536	Đông Hải	\N	86	KV02
29551	Long Châu	\N	86	KV01
29557	Phước Hậu	\N	86	KV02
29566	Tân Ngãi	\N	86	KV02
29584	An Bình	\N	86	KV03
29590	Thanh Đức	\N	86	KV03
29593	Tân Hạnh	\N	86	KV02
29602	Long Hồ	\N	86	KV03
29611	Phú Quới	\N	86	KV02
29623	Nhơn Phú	\N	86	KV02
29638	Bình Phước	\N	86	KV01
29641	Cái Nhum	\N	86	KV01
29653	Tân Long Hội	\N	86	KV01
29659	Trung Thành	\N	86	KV02
29668	Quới An	\N	86	KV01
29677	Quới Thiện	\N	86	KV02
29683	Trung Hiệp	\N	86	KV02
29698	Trung Ngãi	\N	86	KV02
29701	Hiếu Phụng	\N	86	KV01
29713	Hiếu Thành	\N	86	KV01
29719	Tam Bình	\N	86	KV03
29728	Cái Ngang	\N	86	KV03
29734	Hòa Hiệp	\N	86	KV02
29740	Song Phú	\N	86	KV03
29767	Ngãi Tứ	\N	86	KV01
29770	Cái Vồn	\N	86	KV03
29771	Bình Minh	\N	86	KV03
29785	Tân Lược	\N	86	KV03
29788	Mỹ Thuận	\N	86	KV01
29800	Tân Quới	\N	86	KV02
29812	Đông Thành	\N	86	KV03
29821	Trà Ôn	\N	86	KV02
29830	Hòa Bình	\N	86	KV02
29836	Trà Côn	\N	86	KV01
29845	Vĩnh Xuân	\N	86	KV02
29857	Lục Sĩ Thành	\N	86	KV01
30292	Bình Đức	\N	91	KV03
30301	Mỹ Thới	\N	91	KV01
30307	Long Xuyên	\N	91	KV01
30313	Mỹ Hòa Hưng	\N	91	KV01
30316	Châu Đốc	\N	91	KV02
30325	Vĩnh Tế	\N	91	KV02
30337	An Phú	\N	91	KV02
30341	Khánh Bình	\N	91	KV02
30346	Nhơn Hội	\N	91	KV02
30352	Phú Hữu	\N	91	KV02
30367	Vĩnh Hậu	\N	91	KV01
30376	Tân Châu	\N	91	KV03
30377	Long Phú	\N	91	KV02
30385	Vĩnh Xương	\N	91	KV03
30388	Tân An	\N	91	KV01
30403	Châu Phong	\N	91	KV03
30406	Phú Tân	\N	91	KV02
30409	Chợ Vàm	\N	91	KV01
30421	Phú Lâm	\N	91	KV01
30430	Hòa Lạc	\N	91	KV03
30436	Phú An	\N	91	KV02
30445	Bình Thạnh Đông	\N	91	KV02
30463	Châu Phú	\N	91	KV01
30469	Mỹ Đức	\N	91	KV02
30478	Vĩnh Thạnh Trung	\N	91	KV01
30481	Thạnh Mỹ Tây	\N	91	KV03
30487	Bình Mỹ	\N	91	KV02
30502	Thới Sơn	\N	91	KV02
30505	Chi Lăng	\N	91	KV03
30520	Tịnh Biên	\N	91	KV01
30526	An Cư	\N	91	KV02
30538	Núi Cấm	\N	91	KV02
30544	Tri Tôn	\N	91	KV03
30547	Ba Chúc	\N	91	KV03
30568	Vĩnh Gia	\N	91	KV03
30577	Ô Lâm	\N	91	KV03
30580	Cô Tô	\N	91	KV03
30589	An Châu	\N	91	KV01
30595	Cần Đăng	\N	91	KV03
30604	Vĩnh An	\N	91	KV03
30607	Bình Hòa	\N	91	KV01
30619	Vĩnh Hanh	\N	91	KV03
30628	Chợ Mới	\N	91	KV03
30631	Long Điền	\N	91	KV02
30643	Cù Lao Giêng	\N	91	KV02
30658	Nhơn Mỹ	\N	91	KV03
30664	Long Kiến	\N	91	KV03
30673	Hội An	\N	91	KV03
30682	Thoại Sơn	\N	91	KV02
30685	Phú Hòa	\N	91	KV02
30688	Óc Eo	\N	91	KV01
30691	Tây Phú	\N	91	KV02
30697	Vĩnh Trạch	\N	91	KV02
30709	Định Mỹ	\N	91	KV02
30742	Rạch Giá	\N	91	KV03
30760	Vĩnh Thông	\N	91	KV02
30766	Tô Châu	\N	91	KV01
30769	Hà Tiên	\N	91	KV02
30781	Tiên Hải	\N	91	KV03
30787	Kiên Lương	\N	91	KV03
30790	Hòa Điền	\N	91	KV03
30793	Vĩnh Điều	\N	91	KV01
30796	Giang Thành	\N	91	KV02
30811	Sơn Hải	\N	91	KV01
30814	Hòn Nghệ	\N	91	KV02
30817	Hòn Đất	\N	91	KV01
30823	Bình Sơn	\N	91	KV03
30826	Bình Giang	\N	91	KV03
30835	Sơn Kiên	\N	91	KV02
30838	Mỹ Thuận	\N	91	KV01
30850	Tân Hiệp	\N	91	KV02
30856	Tân Hội	\N	91	KV01
30874	Thạnh Đông	\N	91	KV03
30880	Châu Thành	\N	91	KV03
30886	Thạnh Lộc	\N	91	KV01
30898	Bình An	\N	91	KV03
30904	Giồng Riềng	\N	91	KV01
30910	Thạnh Hưng	\N	91	KV01
30928	Ngọc Chúc	\N	91	KV01
30934	Hòa Hưng	\N	91	KV02
30943	Long Thạnh	\N	91	KV03
30949	Hòa Thuận	\N	91	KV03
30952	Gò Quao	\N	91	KV02
30958	Định Hòa	\N	91	KV02
30970	Vĩnh Hòa Hưng	\N	91	KV03
30982	Vĩnh Tuy	\N	91	KV03
30985	An Biên	\N	91	KV03
30988	Tây Yên	\N	91	KV01
31006	Đông Thái	\N	91	KV03
31012	Vĩnh Hòa	\N	91	KV03
31018	An Minh	\N	91	KV03
31024	Đông Hòa	\N	91	KV03
31027	U Minh Thượng	\N	91	KV03
31031	Tân Thạnh	\N	91	KV02
31036	Đông Hưng	\N	91	KV02
31042	Vân Khánh	\N	91	KV01
31051	Vĩnh Phong	\N	91	KV03
31064	Vĩnh Bình	\N	91	KV01
31069	Vĩnh Thuận	\N	91	KV02
31078	Đặc khu Phú Quốc	\N	91	KV01
31105	Đặc khu Thổ Châu	\N	91	KV03
31108	Đặc khu Kiên Hải	\N	91	KV01
31120	Cái Khế	\N	92	KV02
31135	Ninh Kiều	\N	92	KV02
31147	Tân An	\N	92	KV03
31150	An Bình	\N	92	KV02
31153	Ô Môn	\N	92	KV02
31157	Thới Long	\N	92	KV01
31162	Phước Thới	\N	92	KV02
31168	Bình Thủy	\N	92	KV03
31174	Thới An Đông	\N	92	KV01
31183	Long Tuyền	\N	92	KV03
31186	Cái Răng	\N	92	KV01
31201	Hưng Phú	\N	92	KV03
31207	Thốt Nốt	\N	92	KV02
31213	Tân Lộc	\N	92	KV02
31217	Trung Nhứt	\N	92	KV03
31228	Thuận Hưng	\N	92	KV03
31231	Thạnh An	\N	92	KV01
31232	Vĩnh Thạnh	\N	92	KV03
31237	Vĩnh Trinh	\N	92	KV01
31246	Thạnh Quới	\N	92	KV01
31249	Thạnh Phú	\N	92	KV03
31255	Trung Hưng	\N	92	KV02
31258	Thới Lai	\N	92	KV01
31261	Cờ Đỏ	\N	92	KV03
31264	Thới Hưng	\N	92	KV01
31273	Đông Hiệp	\N	92	KV03
31282	Đông Thuận	\N	92	KV01
31288	Trường Thành	\N	92	KV01
31294	Trường Xuân	\N	92	KV03
31299	Phong Điền	\N	92	KV02
31309	Trường Long	\N	92	KV02
31315	Nhơn Ái	\N	92	KV03
31321	Vị Thanh	\N	92	KV03
31333	Vị Tân	\N	92	KV01
31338	Hỏa Lựu	\N	92	KV03
31340	Ngã Bảy	\N	92	KV03
31342	Tân Hòa	\N	92	KV02
31348	Trường Long Tây	\N	92	KV01
31360	Thạnh Xuân	\N	92	KV02
31366	Châu Thành	\N	92	KV01
31369	Đông Phước	\N	92	KV01
31378	Phú Hữu	\N	92	KV02
31393	Hòa An	\N	92	KV03
31396	Hiệp Hưng	\N	92	KV01
31399	Tân Bình	\N	92	KV03
31408	Thạnh Hòa	\N	92	KV01
31411	Đại Thành	\N	92	KV02
31420	Phụng Hiệp	\N	92	KV01
31426	Phương Bình	\N	92	KV01
31432	Tân Phước Hưng	\N	92	KV03
31441	Vị Thủy	\N	92	KV02
31453	Vĩnh Thuận Đông	\N	92	KV03
31459	Vĩnh Tường	\N	92	KV01
31465	Vị Thanh 1	\N	92	KV01
31471	Long Mỹ	\N	92	KV03
31473	Long Bình	\N	92	KV02
31480	Long Phú 1	\N	92	KV02
31489	Vĩnh Viễn	\N	92	KV02
31492	Lương Tâm	\N	92	KV02
31495	Xà Phiên	\N	92	KV03
31507	Sóc Trăng	\N	92	KV03
31510	Phú Lợi	\N	92	KV03
31528	Kế Sách	\N	92	KV02
31531	An Lạc Thôn	\N	92	KV02
31537	Phong Nẫm	\N	92	KV01
31540	Thới An Hội	\N	92	KV03
31552	Nhơn Mỹ	\N	92	KV01
31561	Đại Hải	\N	92	KV03
31567	Mỹ Tú	\N	92	KV01
31569	Phú Tâm	\N	92	KV03
31570	Hồ Đắc Kiện	\N	92	KV01
31579	Long Hưng	\N	92	KV02
31582	Thuận Hòa	\N	92	KV03
31591	Mỹ Hương	\N	92	KV01
31594	An Ninh	\N	92	KV03
31603	Mỹ Phước	\N	92	KV01
31615	An Thạnh	\N	92	KV02
31633	Cù Lao Dung	\N	92	KV01
31639	Long Phú	\N	92	KV01
31645	Đại Ngãi	\N	92	KV01
31654	Trường Khánh	\N	92	KV01
31666	Tân Thạnh	\N	92	KV02
31673	Trần Đề	\N	92	KV02
31675	Liêu Tú	\N	92	KV03
31679	Lịch Hội Thượng	\N	92	KV03
31684	Mỹ Xuyên	\N	92	KV03
31687	Tài Văn	\N	92	KV03
31699	Thạnh Thới An	\N	92	KV02
31708	Nhu Gia	\N	92	KV03
31717	Hòa Tú	\N	92	KV03
31723	Ngọc Tố	\N	92	KV03
31726	Gia Hòa	\N	92	KV01
31732	Ngã Năm	\N	92	KV01
31741	Tân Long	\N	92	KV01
31753	Mỹ Quới	\N	92	KV03
31756	Phú Lộc	\N	92	KV03
31759	Lâm Tân	\N	92	KV01
31777	Vĩnh Lợi	\N	92	KV01
31783	Vĩnh Châu	\N	92	KV01
31789	Khánh Hòa	\N	92	KV01
31795	Vĩnh Hải	\N	92	KV01
31804	Vĩnh Phước	\N	92	KV03
31810	Lai Hòa	\N	92	KV02
31825	Bạc Liêu	\N	96	KV03
31834	Vĩnh Trạch	\N	96	KV03
31840	Hiệp Thành	\N	96	KV03
31843	Hồng Dân	\N	96	KV01
31849	Ninh Quới	\N	96	KV02
31858	Vĩnh Lộc	\N	96	KV01
31864	Ninh Thạnh Lợi	\N	96	KV02
31867	Phước Long	\N	96	KV02
31876	Vĩnh Phước	\N	96	KV02
31882	Vĩnh Thanh	\N	96	KV03
31885	Phong Hiệp	\N	96	KV03
31891	Hòa Bình	\N	96	KV03
31894	Châu Thới	\N	96	KV03
31900	Vĩnh Lợi	\N	96	KV02
31906	Hưng Hội	\N	96	KV03
31918	Vĩnh Mỹ	\N	96	KV03
31927	Vĩnh Hậu	\N	96	KV02
31942	Giá Rai	\N	96	KV01
31951	Láng Tròn	\N	96	KV02
31957	Phong Thạnh	\N	96	KV01
31972	Gành Hào	\N	96	KV01
31975	Đông Hải	\N	96	KV02
31985	Long Điền	\N	96	KV01
31988	An Trạch	\N	96	KV01
31993	Định Thành	\N	96	KV02
32002	An Xuyên	\N	96	KV02
32014	Lý Văn Lâm	\N	96	KV02
32025	Tân Thành	\N	96	KV01
32041	Hòa Thành	\N	96	KV03
32044	Nguyễn Phích	\N	96	KV02
32047	U Minh	\N	96	KV01
32059	Khánh An	\N	96	KV02
32062	Khánh Lâm	\N	96	KV03
32065	Thới Bình	\N	96	KV02
32069	Biển Bạch	\N	96	KV02
32071	Trí Phải	\N	96	KV01
32083	Tân Lộc	\N	96	KV03
32092	Hồ Thị Kỷ	\N	96	KV02
32095	Trần Văn Thời	\N	96	KV03
32098	Sông Đốc	\N	96	KV03
32104	Đá Bạc	\N	96	KV01
32110	Khánh Bình	\N	96	KV02
32119	Khánh Hưng	\N	96	KV01
32128	Cái Nước	\N	96	KV01
32134	Lương Thế Trân	\N	96	KV02
32137	Tân Hưng	\N	96	KV01
32140	Hưng Mỹ	\N	96	KV03
32152	Đầm Dơi	\N	96	KV02
32155	Tạ An Khương	\N	96	KV01
32161	Trần Phán	\N	96	KV02
32167	Tân Thuận	\N	96	KV01
32182	Quách Phẩm	\N	96	KV01
32185	Thanh Tùng	\N	96	KV02
32188	Tân Tiến	\N	96	KV03
32191	Năm Căn	\N	96	KV02
32201	Đất Mới	\N	96	KV03
32206	Tam Giang	\N	96	KV03
32212	Cái Đôi Vàm	\N	96	KV03
32214	Phú Mỹ	\N	96	KV03
32218	Phú Tân	\N	96	KV02
32227	Nguyễn Việt Khái	\N	96	KV01
32236	Tân Ân	\N	96	KV03
32244	Phan Ngọc Hiển	\N	96	KV01
32248	Đất Mũi	\N	96	KV03
\.


--
-- Data for Name: yeucauxulysuco; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.yeucauxulysuco (ycxlsc_ma, ycxlsc_thoidiem, ycxlsc_ten, ycxlsc_denghi, ycxlsc_mota, lsc_ma, dts_ma, ct_ma_denghi) FROM stdin;
\.


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
-- Name: chitietlichsutimkiem chitietlichsutimkiem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitietlichsutimkiem
    ADD CONSTRAINT chitietlichsutimkiem_pkey PRIMARY KEY (kh_ma, ctsp_ma, ctlstk_thoidiem);


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
-- Name: chitiettrangthaisanpham chitiettrangthaisanpham_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiettrangthaisanpham
    ADD CONSTRAINT chitiettrangthaisanpham_pkey PRIMARY KEY (stmdt_ma, ttctsp_ma, ctsp_ma, ctttsp_thoidiem);


--
-- Name: chitiettrangthaisuco chitiettrangthaisuco_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiettrangthaisuco
    ADD CONSTRAINT chitiettrangthaisuco_pkey PRIMARY KEY (ycxlsc_ma, ttxlsc_ma, ctxlsc_thoidiem);


--
-- Name: chiutrachnhiemsuco chiutrachnhiemsuco_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chiutrachnhiemsuco
    ADD CONSTRAINT chiutrachnhiemsuco_pkey PRIMARY KEY (ct_ma_chiutrachnhiem, ycxlsc_ma);


--
-- Name: chuthe chuthe_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chuthe
    ADD CONSTRAINT chuthe_pkey PRIMARY KEY (ct_ma);


--
-- Name: cuocphivanchuyen cuocphivanchuyen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuocphivanchuyen
    ADD CONSTRAINT cuocphivanchuyen_pkey PRIMARY KEY (kvvc_ma, klkh_ma, cpvc_thoidiem, tvc_ma, dvvc_ma);


--
-- Name: danhgiasanpham danhgiasanpham_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danhgiasanpham
    ADD CONSTRAINT danhgiasanpham_pkey PRIMARY KEY (kh_ma, ctsp_ma, dts_ma);


--
-- Name: danhmucsanpham danhmucsanpham_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danhmucsanpham
    ADD CONSTRAINT danhmucsanpham_pkey PRIMARY KEY (dmsp_ma);


--
-- Name: diachi diachi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diachi
    ADD CONSTRAINT diachi_pkey PRIMARY KEY (dc_ma);


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
-- Name: donvivanchuyen donvivanchuyen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donvivanchuyen
    ADD CONSTRAINT donvivanchuyen_pkey PRIMARY KEY (dvvc_ma);


--
-- Name: dvvc_thongbao dvvc_thongbao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dvvc_thongbao
    ADD CONSTRAINT dvvc_thongbao_pkey PRIMARY KEY (tbdvvc_ma);


--
-- Name: giabangoc giabangoc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giabangoc
    ADD CONSTRAINT giabangoc_pkey PRIMARY KEY (gb_ma);


--
-- Name: gianhang_donvivanchuyen gianhang_donvivanchuyen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gianhang_donvivanchuyen
    ADD CONSTRAINT gianhang_donvivanchuyen_pkey PRIMARY KEY (gh_ma, dvvc_ma);


--
-- Name: gianhang_kiennghi gianhang_kiennghi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gianhang_kiennghi
    ADD CONSTRAINT gianhang_kiennghi_pkey PRIMARY KEY (ghkn_ma);


--
-- Name: gianhang gianhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gianhang
    ADD CONSTRAINT gianhang_pkey PRIMARY KEY (gh_ma);


--
-- Name: giatrithuoctinh giatrithuoctinh_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giatrithuoctinh
    ADD CONSTRAINT giatrithuoctinh_pkey PRIMARY KEY (ttsp_ma, ctsp_ma);


--
-- Name: hinhanhsanpham hinhanhsanpham_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hinhanhsanpham
    ADD CONSTRAINT hinhanhsanpham_pkey PRIMARY KEY (hasp_ma);


--
-- Name: hoantien hoantien_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoantien
    ADD CONSTRAINT hoantien_pkey PRIMARY KEY (ht_ma);


--
-- Name: khachhang khachhang_kh_sdt_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khachhang
    ADD CONSTRAINT khachhang_kh_sdt_key UNIQUE (kh_sdt);


--
-- Name: khachhang khachhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khachhang
    ADD CONSTRAINT khachhang_pkey PRIMARY KEY (kh_ma);


--
-- Name: khachhang_theodoi_shop khachhang_theodoi_shop_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khachhang_theodoi_shop
    ADD CONSTRAINT khachhang_theodoi_shop_pkey PRIMARY KEY (kh_ma, gh_ma);


--
-- Name: kho kho_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kho
    ADD CONSTRAINT kho_pkey PRIMARY KEY (kho_ma);


--
-- Name: khoiluongkienhang khoiluongkienhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khoiluongkienhang
    ADD CONSTRAINT khoiluongkienhang_pkey PRIMARY KEY (klkh_ma);


--
-- Name: khomggsan khomggsan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khomggsan
    ADD CONSTRAINT khomggsan_pkey PRIMARY KEY (mgg_ma, kh_ma);


--
-- Name: khomggshop khomggshop_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khomggshop
    ADD CONSTRAINT khomggshop_pkey PRIMARY KEY (mgg_shop_ma, kh_ma);


--
-- Name: khomggvanchuyen khomggvanchuyen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khomggvanchuyen
    ADD CONSTRAINT khomggvanchuyen_pkey PRIMARY KEY (mgg_vc_ma, kh_ma);


--
-- Name: khuvucvanchuyen khuvucvanchuyen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khuvucvanchuyen
    ADD CONSTRAINT khuvucvanchuyen_pkey PRIMARY KEY (kvvc_ma);


--
-- Name: loaikho loaikho_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loaikho
    ADD CONSTRAINT loaikho_pkey PRIMARY KEY (lk_ma);


--
-- Name: loaisuco loaisuco_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loaisuco
    ADD CONSTRAINT loaisuco_pkey PRIMARY KEY (lsc_ma);


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
-- Name: magiamgiasan magiamgiasan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.magiamgiasan
    ADD CONSTRAINT magiamgiasan_pkey PRIMARY KEY (mgg_san_ma);


--
-- Name: mien mien_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mien
    ADD CONSTRAINT mien_pkey PRIMARY KEY (mien_ma);


--
-- Name: minhchungsuco minhchungsuco_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.minhchungsuco
    ADD CONSTRAINT minhchungsuco_pkey PRIMARY KEY (mcsc_ma);


--
-- Name: nganhang nganhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nganhang
    ADD CONSTRAINT nganhang_pkey PRIMARY KEY (nhg_ma);


--
-- Name: nganhhang nganhhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nganhhang
    ADD CONSTRAINT nganhhang_pkey PRIMARY KEY (nh_ma);


--
-- Name: phisanchieckhau phisanchieckhau_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phisanchieckhau
    ADD CONSTRAINT phisanchieckhau_pkey PRIMARY KEY (nh_ma, psck_thoidiem, stmdt_ma);


--
-- Name: phuongthucthanhtoan phuongthucthanhtoan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phuongthucthanhtoan
    ADD CONSTRAINT phuongthucthanhtoan_pkey PRIMARY KEY (pttt_ma);


--
-- Name: san_thuong_mai_dien_tu san_thuong_mai_dien_tu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.san_thuong_mai_dien_tu
    ADD CONSTRAINT san_thuong_mai_dien_tu_pkey PRIMARY KEY (stmdt_ma);


--
-- Name: sanpham sanpham_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanpham
    ADD CONSTRAINT sanpham_pkey PRIMARY KEY (sp_ma);


--
-- Name: sanphamyeuthich sanphamyeuthich_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanphamyeuthich
    ADD CONSTRAINT sanphamyeuthich_pkey PRIMARY KEY (kh_ma, ctsp_ma);


--
-- Name: shipper shipper_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipper
    ADD CONSTRAINT shipper_pkey PRIMARY KEY (shipper_ma);


--
-- Name: shipper shipper_shipper_sdt_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipper
    ADD CONSTRAINT shipper_shipper_sdt_key UNIQUE (shipper_sdt);


--
-- Name: thongbao_gianhang thongbao_gianhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongbao_gianhang
    ADD CONSTRAINT thongbao_gianhang_pkey PRIMARY KEY (tbhg_ma);


--
-- Name: thongbao_khachhang thongbao_khachhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongbao_khachhang
    ADD CONSTRAINT thongbao_khachhang_pkey PRIMARY KEY (tbkh_ma);


--
-- Name: thongbao_san thongbao_san_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongbao_san
    ADD CONSTRAINT thongbao_san_pkey PRIMARY KEY (tbs_ma);


--
-- Name: thongtingiaohang thongtingiaohang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtingiaohang
    ADD CONSTRAINT thongtingiaohang_pkey PRIMARY KEY (dts_ma, ttgh_thoidiem, shipper_ma);


--
-- Name: thongtinlayhang thongtinlayhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinlayhang
    ADD CONSTRAINT thongtinlayhang_pkey PRIMARY KEY (dts_ma, ttlh_thoidiem, shipper_ma);


--
-- Name: thongtinnhanhang thongtinnhanhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhanhang
    ADD CONSTRAINT thongtinnhanhang_pkey PRIMARY KEY (ttnh_ma);


--
-- Name: thongtinnhantien_dvvc thongtinnhantien_dvvc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhantien_dvvc
    ADD CONSTRAINT thongtinnhantien_dvvc_pkey PRIMARY KEY (dvvc_ma, nganhang_ma);


--
-- Name: thongtinnhantien_gianhang thongtinnhantien_gianhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhantien_gianhang
    ADD CONSTRAINT thongtinnhantien_gianhang_pkey PRIMARY KEY (gh_ma, nh_ma);


--
-- Name: thongtinnhantien_kh thongtinnhantien_kh_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhantien_kh
    ADD CONSTRAINT thongtinnhantien_kh_pkey PRIMARY KEY (kh_ma, nganhang_ma);


--
-- Name: thongtinnhantien_stmdt thongtinnhantien_stmdt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhantien_stmdt
    ADD CONSTRAINT thongtinnhantien_stmdt_pkey PRIMARY KEY (stmdt_ma, nganhang_ma);


--
-- Name: thongtinthanhtoan thongtinthanhtoan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinthanhtoan
    ADD CONSTRAINT thongtinthanhtoan_pkey PRIMARY KEY (dts_ma, tttt_thoidiem, pttt_ma);


--
-- Name: thuoctinhsanpham thuoctinhsanpham_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thuoctinhsanpham
    ADD CONSTRAINT thuoctinhsanpham_pkey PRIMARY KEY (thsp_ma);


--
-- Name: thuonghieu thuonghieu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thuonghieu
    ADD CONSTRAINT thuonghieu_pkey PRIMARY KEY (th_ma);


--
-- Name: tinhtp tinhtp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tinhtp
    ADD CONSTRAINT tinhtp_pkey PRIMARY KEY (tinh_ma);


--
-- Name: trangthaichitietsanpham trangthaichitietsanpham_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trangthaichitietsanpham
    ADD CONSTRAINT trangthaichitietsanpham_pkey PRIMARY KEY (ttctsp_ma);


--
-- Name: trangthaidonhang trangthaidonhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trangthaidonhang
    ADD CONSTRAINT trangthaidonhang_pkey PRIMARY KEY (ttdh_ma);


--
-- Name: trangthaixulysuco trangthaixulysuco_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trangthaixulysuco
    ADD CONSTRAINT trangthaixulysuco_pkey PRIMARY KEY (ttxlsc_ma);


--
-- Name: tuyenvanchuyen tuyenvanchuyen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tuyenvanchuyen
    ADD CONSTRAINT tuyenvanchuyen_pkey PRIMARY KEY (tvc_ma);


--
-- Name: vitridonhang vitridonhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vitridonhang
    ADD CONSTRAINT vitridonhang_pkey PRIMARY KEY (kho_ma, dts_ma);


--
-- Name: xaphuong xaphuong_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.xaphuong
    ADD CONSTRAINT xaphuong_pkey PRIMARY KEY (xa_ma);


--
-- Name: yeucauxulysuco yeucauxulysuco_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yeucauxulysuco
    ADD CONSTRAINT yeucauxulysuco_pkey PRIMARY KEY (ycxlsc_ma);


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
-- Name: chitietlichsutimkiem chitietlichsutimkiem_ctsp_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitietlichsutimkiem
    ADD CONSTRAINT chitietlichsutimkiem_ctsp_ma_fkey FOREIGN KEY (ctsp_ma) REFERENCES public.chitietsanpham(ctsp_ma) ON DELETE CASCADE;


--
-- Name: chitietlichsutimkiem chitietlichsutimkiem_kh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitietlichsutimkiem
    ADD CONSTRAINT chitietlichsutimkiem_kh_ma_fkey FOREIGN KEY (kh_ma) REFERENCES public.khachhang(kh_ma) ON DELETE CASCADE;


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
-- Name: chitiettrangthaisanpham chitiettrangthaisanpham_ctsp_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiettrangthaisanpham
    ADD CONSTRAINT chitiettrangthaisanpham_ctsp_ma_fkey FOREIGN KEY (ctsp_ma) REFERENCES public.chitietsanpham(ctsp_ma);


--
-- Name: chitiettrangthaisanpham chitiettrangthaisanpham_stmdt_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiettrangthaisanpham
    ADD CONSTRAINT chitiettrangthaisanpham_stmdt_ma_fkey FOREIGN KEY (stmdt_ma) REFERENCES public.san_thuong_mai_dien_tu(stmdt_ma);


--
-- Name: chitiettrangthaisanpham chitiettrangthaisanpham_ttctsp_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiettrangthaisanpham
    ADD CONSTRAINT chitiettrangthaisanpham_ttctsp_ma_fkey FOREIGN KEY (ttctsp_ma) REFERENCES public.trangthaichitietsanpham(ttctsp_ma);


--
-- Name: chitiettrangthaisuco chitiettrangthaisuco_ttxlsc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiettrangthaisuco
    ADD CONSTRAINT chitiettrangthaisuco_ttxlsc_ma_fkey FOREIGN KEY (ttxlsc_ma) REFERENCES public.trangthaixulysuco(ttxlsc_ma);


--
-- Name: chitiettrangthaisuco chitiettrangthaisuco_ycxlsc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiettrangthaisuco
    ADD CONSTRAINT chitiettrangthaisuco_ycxlsc_ma_fkey FOREIGN KEY (ycxlsc_ma) REFERENCES public.yeucauxulysuco(ycxlsc_ma) ON DELETE CASCADE;


--
-- Name: chiutrachnhiemsuco chiutrachnhiemsuco_ct_ma_chiutrachnhiem_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chiutrachnhiemsuco
    ADD CONSTRAINT chiutrachnhiemsuco_ct_ma_chiutrachnhiem_fkey FOREIGN KEY (ct_ma_chiutrachnhiem) REFERENCES public.chuthe(ct_ma);


--
-- Name: chiutrachnhiemsuco chiutrachnhiemsuco_ycxlsc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chiutrachnhiemsuco
    ADD CONSTRAINT chiutrachnhiemsuco_ycxlsc_ma_fkey FOREIGN KEY (ycxlsc_ma) REFERENCES public.yeucauxulysuco(ycxlsc_ma) ON DELETE CASCADE;


--
-- Name: giabangoc ctsp_ma; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giabangoc
    ADD CONSTRAINT ctsp_ma FOREIGN KEY (ctsp_ma) REFERENCES public.chitietsanpham(ctsp_ma) ON DELETE CASCADE;


--
-- Name: hinhanhsanpham ctsp_ma; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hinhanhsanpham
    ADD CONSTRAINT ctsp_ma FOREIGN KEY (ctsp_ma) REFERENCES public.chitietsanpham(ctsp_ma) ON DELETE CASCADE;


--
-- Name: cuocphivanchuyen cuocphivanchuyen_dvvc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuocphivanchuyen
    ADD CONSTRAINT cuocphivanchuyen_dvvc_ma_fkey FOREIGN KEY (dvvc_ma) REFERENCES public.donvivanchuyen(dvvc_ma);


--
-- Name: cuocphivanchuyen cuocphivanchuyen_klkh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuocphivanchuyen
    ADD CONSTRAINT cuocphivanchuyen_klkh_ma_fkey FOREIGN KEY (klkh_ma) REFERENCES public.khoiluongkienhang(klkh_ma) ON DELETE CASCADE;


--
-- Name: cuocphivanchuyen cuocphivanchuyen_kvvc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuocphivanchuyen
    ADD CONSTRAINT cuocphivanchuyen_kvvc_ma_fkey FOREIGN KEY (kvvc_ma) REFERENCES public.khuvucvanchuyen(kvvc_ma);


--
-- Name: cuocphivanchuyen cuocphivanchuyen_tvc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuocphivanchuyen
    ADD CONSTRAINT cuocphivanchuyen_tvc_ma_fkey FOREIGN KEY (tvc_ma) REFERENCES public.tuyenvanchuyen(tvc_ma);


--
-- Name: danhgiasanpham danhgiasanpham_ctsp_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danhgiasanpham
    ADD CONSTRAINT danhgiasanpham_ctsp_ma_fkey FOREIGN KEY (ctsp_ma) REFERENCES public.chitietsanpham(ctsp_ma);


--
-- Name: danhgiasanpham danhgiasanpham_dts_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danhgiasanpham
    ADD CONSTRAINT danhgiasanpham_dts_ma_fkey FOREIGN KEY (dts_ma) REFERENCES public.donhangtheoshop(dts_ma);


--
-- Name: danhgiasanpham danhgiasanpham_kh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danhgiasanpham
    ADD CONSTRAINT danhgiasanpham_kh_ma_fkey FOREIGN KEY (kh_ma) REFERENCES public.khachhang(kh_ma);


--
-- Name: danhmucsanpham danhmucsanpham_gh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danhmucsanpham
    ADD CONSTRAINT danhmucsanpham_gh_ma_fkey FOREIGN KEY (gh_ma) REFERENCES public.gianhang(gh_ma);


--
-- Name: diachi diachi_xa_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diachi
    ADD CONSTRAINT diachi_xa_ma_fkey FOREIGN KEY (xa_ma) REFERENCES public.xaphuong(xa_ma);


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
-- Name: donvivanchuyen donvivanchuyen_ct_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donvivanchuyen
    ADD CONSTRAINT donvivanchuyen_ct_ma_fkey FOREIGN KEY (ct_ma) REFERENCES public.chuthe(ct_ma);


--
-- Name: dvvc_thongbao dvvc_thongbao_dvvc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dvvc_thongbao
    ADD CONSTRAINT dvvc_thongbao_dvvc_ma_fkey FOREIGN KEY (dvvc_ma) REFERENCES public.donvivanchuyen(dvvc_ma);


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
-- Name: gianhang_donvivanchuyen gianhang_donvivanchuyen_dvvc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gianhang_donvivanchuyen
    ADD CONSTRAINT gianhang_donvivanchuyen_dvvc_ma_fkey FOREIGN KEY (dvvc_ma) REFERENCES public.donvivanchuyen(dvvc_ma) ON DELETE CASCADE;


--
-- Name: gianhang_donvivanchuyen gianhang_donvivanchuyen_gh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gianhang_donvivanchuyen
    ADD CONSTRAINT gianhang_donvivanchuyen_gh_ma_fkey FOREIGN KEY (gh_ma) REFERENCES public.gianhang(gh_ma) ON DELETE CASCADE;


--
-- Name: gianhang_kiennghi gianhang_kiennghi_gh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gianhang_kiennghi
    ADD CONSTRAINT gianhang_kiennghi_gh_ma_fkey FOREIGN KEY (gh_ma) REFERENCES public.gianhang(gh_ma);


--
-- Name: gianhang_kiennghi gianhang_kiennghi_stmdt_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gianhang_kiennghi
    ADD CONSTRAINT gianhang_kiennghi_stmdt_ma_fkey FOREIGN KEY (stmdt_ma) REFERENCES public.san_thuong_mai_dien_tu(stmdt_ma);


--
-- Name: giatrithuoctinh giatrithuoctinh_ctsp_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giatrithuoctinh
    ADD CONSTRAINT giatrithuoctinh_ctsp_ma_fkey FOREIGN KEY (ctsp_ma) REFERENCES public.chitietsanpham(ctsp_ma) ON DELETE CASCADE;


--
-- Name: giatrithuoctinh giatrithuoctinh_ttsp_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giatrithuoctinh
    ADD CONSTRAINT giatrithuoctinh_ttsp_ma_fkey FOREIGN KEY (ttsp_ma) REFERENCES public.thuoctinhsanpham(thsp_ma);


--
-- Name: hinhanhsanpham hinhanhsanpham_ctsp_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hinhanhsanpham
    ADD CONSTRAINT hinhanhsanpham_ctsp_ma_fkey FOREIGN KEY (ctsp_ma) REFERENCES public.chitietsanpham(ctsp_ma);


--
-- Name: hoantien hoantien_ct_nhantien_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoantien
    ADD CONSTRAINT hoantien_ct_nhantien_fkey FOREIGN KEY (ct_nhantien) REFERENCES public.chuthe(ct_ma);


--
-- Name: hoantien hoantien_ct_tratien_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoantien
    ADD CONSTRAINT hoantien_ct_tratien_fkey FOREIGN KEY (ct_tratien) REFERENCES public.chuthe(ct_ma);


--
-- Name: hoantien hoantien_ycxlsc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoantien
    ADD CONSTRAINT hoantien_ycxlsc_ma_fkey FOREIGN KEY (ycxlsc_ma) REFERENCES public.yeucauxulysuco(ycxlsc_ma);


--
-- Name: khachhang khachhang_ct_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khachhang
    ADD CONSTRAINT khachhang_ct_ma_fkey FOREIGN KEY (ct_ma) REFERENCES public.chuthe(ct_ma);


--
-- Name: khachhang_theodoi_shop khachhang_theodoi_shop_gh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khachhang_theodoi_shop
    ADD CONSTRAINT khachhang_theodoi_shop_gh_ma_fkey FOREIGN KEY (gh_ma) REFERENCES public.gianhang(gh_ma) ON DELETE CASCADE;


--
-- Name: khachhang_theodoi_shop khachhang_theodoi_shop_kh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khachhang_theodoi_shop
    ADD CONSTRAINT khachhang_theodoi_shop_kh_ma_fkey FOREIGN KEY (kh_ma) REFERENCES public.khachhang(kh_ma) ON DELETE CASCADE;


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
-- Name: kho kho_lk_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kho
    ADD CONSTRAINT kho_lk_ma_fkey FOREIGN KEY (lk_ma) REFERENCES public.loaikho(lk_ma);


--
-- Name: khomggsan khomggsan_kh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khomggsan
    ADD CONSTRAINT khomggsan_kh_ma_fkey FOREIGN KEY (kh_ma) REFERENCES public.khachhang(kh_ma) ON DELETE CASCADE;


--
-- Name: khomggshop khomggshop_kh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khomggshop
    ADD CONSTRAINT khomggshop_kh_ma_fkey FOREIGN KEY (kh_ma) REFERENCES public.khachhang(kh_ma) ON DELETE CASCADE;


--
-- Name: khomggvanchuyen khomggvanchuyen_kh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khomggvanchuyen
    ADD CONSTRAINT khomggvanchuyen_kh_ma_fkey FOREIGN KEY (kh_ma) REFERENCES public.khachhang(kh_ma) ON DELETE CASCADE;


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
-- Name: magiamgiasan magiamgiasan_stmdt_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.magiamgiasan
    ADD CONSTRAINT magiamgiasan_stmdt_ma_fkey FOREIGN KEY (stmdt_ma) REFERENCES public.san_thuong_mai_dien_tu(stmdt_ma);


--
-- Name: minhchungsuco minhchungsuco_ycxlsc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.minhchungsuco
    ADD CONSTRAINT minhchungsuco_ycxlsc_ma_fkey FOREIGN KEY (ycxlsc_ma) REFERENCES public.yeucauxulysuco(ycxlsc_ma) ON DELETE CASCADE;


--
-- Name: nganhhang nganhhang_nh_cha_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nganhhang
    ADD CONSTRAINT nganhhang_nh_cha_fkey FOREIGN KEY (nh_cha) REFERENCES public.nganhhang(nh_ma) ON DELETE SET NULL;


--
-- Name: phisanchieckhau phisanchieckhau_nh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phisanchieckhau
    ADD CONSTRAINT phisanchieckhau_nh_ma_fkey FOREIGN KEY (nh_ma) REFERENCES public.nganhhang(nh_ma) ON DELETE CASCADE;


--
-- Name: phisanchieckhau phisanchieckhau_stmdt_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phisanchieckhau
    ADD CONSTRAINT phisanchieckhau_stmdt_ma_fkey FOREIGN KEY (stmdt_ma) REFERENCES public.san_thuong_mai_dien_tu(stmdt_ma) ON DELETE CASCADE;


--
-- Name: san_thuong_mai_dien_tu san_thuong_mai_dien_tu_ct_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.san_thuong_mai_dien_tu
    ADD CONSTRAINT san_thuong_mai_dien_tu_ct_ma_fkey FOREIGN KEY (ct_ma) REFERENCES public.chuthe(ct_ma);


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
-- Name: sanphamyeuthich sanphamyeuthich_ctsp_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanphamyeuthich
    ADD CONSTRAINT sanphamyeuthich_ctsp_ma_fkey FOREIGN KEY (ctsp_ma) REFERENCES public.chitietsanpham(ctsp_ma) ON DELETE CASCADE;


--
-- Name: sanphamyeuthich sanphamyeuthich_kh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanphamyeuthich
    ADD CONSTRAINT sanphamyeuthich_kh_ma_fkey FOREIGN KEY (kh_ma) REFERENCES public.khachhang(kh_ma) ON DELETE CASCADE;


--
-- Name: shipper shipper_kho_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipper
    ADD CONSTRAINT shipper_kho_ma_fkey FOREIGN KEY (kho_ma) REFERENCES public.kho(kho_ma);


--
-- Name: thongbao_gianhang thongbao_gianhang_gh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongbao_gianhang
    ADD CONSTRAINT thongbao_gianhang_gh_ma_fkey FOREIGN KEY (gh_ma) REFERENCES public.gianhang(gh_ma);


--
-- Name: thongbao_khachhang thongbao_khachhang_kh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongbao_khachhang
    ADD CONSTRAINT thongbao_khachhang_kh_ma_fkey FOREIGN KEY (kh_ma) REFERENCES public.khachhang(kh_ma);


--
-- Name: thongbao_san thongbao_san_stmdt_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongbao_san
    ADD CONSTRAINT thongbao_san_stmdt_ma_fkey FOREIGN KEY (stmdt_ma) REFERENCES public.san_thuong_mai_dien_tu(stmdt_ma);


--
-- Name: thongtingiaohang thongtingiaohang_dts_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtingiaohang
    ADD CONSTRAINT thongtingiaohang_dts_ma_fkey FOREIGN KEY (dts_ma) REFERENCES public.donhangtheoshop(dts_ma) ON DELETE CASCADE;


--
-- Name: thongtingiaohang thongtingiaohang_shipper_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtingiaohang
    ADD CONSTRAINT thongtingiaohang_shipper_ma_fkey FOREIGN KEY (shipper_ma) REFERENCES public.shipper(shipper_ma);


--
-- Name: thongtinlayhang thongtinlayhang_dts_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinlayhang
    ADD CONSTRAINT thongtinlayhang_dts_ma_fkey FOREIGN KEY (dts_ma) REFERENCES public.donhangtheoshop(dts_ma) ON DELETE CASCADE;


--
-- Name: thongtinlayhang thongtinlayhang_shipper_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinlayhang
    ADD CONSTRAINT thongtinlayhang_shipper_ma_fkey FOREIGN KEY (shipper_ma) REFERENCES public.shipper(shipper_ma);


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
-- Name: thongtinnhantien_dvvc thongtinnhantien_dvvc_dvvc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhantien_dvvc
    ADD CONSTRAINT thongtinnhantien_dvvc_dvvc_ma_fkey FOREIGN KEY (dvvc_ma) REFERENCES public.donvivanchuyen(dvvc_ma);


--
-- Name: thongtinnhantien_dvvc thongtinnhantien_dvvc_nganhang_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhantien_dvvc
    ADD CONSTRAINT thongtinnhantien_dvvc_nganhang_ma_fkey FOREIGN KEY (nganhang_ma) REFERENCES public.nganhang(nhg_ma);


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
-- Name: thongtinnhantien_kh thongtinnhantien_kh_kh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhantien_kh
    ADD CONSTRAINT thongtinnhantien_kh_kh_ma_fkey FOREIGN KEY (kh_ma) REFERENCES public.khachhang(kh_ma);


--
-- Name: thongtinnhantien_kh thongtinnhantien_kh_nganhang_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinnhantien_kh
    ADD CONSTRAINT thongtinnhantien_kh_nganhang_ma_fkey FOREIGN KEY (nganhang_ma) REFERENCES public.nganhang(nhg_ma);


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
-- Name: thongtinthanhtoan thongtinthanhtoan_dts_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinthanhtoan
    ADD CONSTRAINT thongtinthanhtoan_dts_ma_fkey FOREIGN KEY (dts_ma) REFERENCES public.donhangtheoshop(dts_ma) ON DELETE CASCADE;


--
-- Name: thongtinthanhtoan thongtinthanhtoan_pttt_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinthanhtoan
    ADD CONSTRAINT thongtinthanhtoan_pttt_ma_fkey FOREIGN KEY (pttt_ma) REFERENCES public.phuongthucthanhtoan(pttt_ma);


--
-- Name: tinhtp tinhtp_mien_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tinhtp
    ADD CONSTRAINT tinhtp_mien_ma_fkey FOREIGN KEY (mien_ma) REFERENCES public.mien(mien_ma);


--
-- Name: vitridonhang vitridonhang_dts_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vitridonhang
    ADD CONSTRAINT vitridonhang_dts_ma_fkey FOREIGN KEY (dts_ma) REFERENCES public.donhangtheoshop(dts_ma);


--
-- Name: vitridonhang vitridonhang_kho_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vitridonhang
    ADD CONSTRAINT vitridonhang_kho_ma_fkey FOREIGN KEY (kho_ma) REFERENCES public.kho(kho_ma);


--
-- Name: xaphuong xaphuong_kvvc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.xaphuong
    ADD CONSTRAINT xaphuong_kvvc_ma_fkey FOREIGN KEY (kvvc_ma) REFERENCES public.khuvucvanchuyen(kvvc_ma);


--
-- Name: xaphuong xaphuong_tinh_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.xaphuong
    ADD CONSTRAINT xaphuong_tinh_ma_fkey FOREIGN KEY (tinh_ma) REFERENCES public.tinhtp(tinh_ma);


--
-- Name: yeucauxulysuco yeucauxulysuco_ct_ma_denghi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yeucauxulysuco
    ADD CONSTRAINT yeucauxulysuco_ct_ma_denghi_fkey FOREIGN KEY (ct_ma_denghi) REFERENCES public.chuthe(ct_ma);


--
-- Name: yeucauxulysuco yeucauxulysuco_dts_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yeucauxulysuco
    ADD CONSTRAINT yeucauxulysuco_dts_ma_fkey FOREIGN KEY (dts_ma) REFERENCES public.donhangtheoshop(dts_ma);


--
-- Name: yeucauxulysuco yeucauxulysuco_lsc_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yeucauxulysuco
    ADD CONSTRAINT yeucauxulysuco_lsc_ma_fkey FOREIGN KEY (lsc_ma) REFERENCES public.loaisuco(lsc_ma);


--
-- PostgreSQL database dump complete
--

\unrestrict aiT5aDrV8fxieXRGCgWY4jiRdC0CvsPuEyqcykrM6YNRKMB4SKGbOv7oANrHq8g

