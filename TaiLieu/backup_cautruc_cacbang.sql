--
-- PostgreSQL database dump
--

\restrict VvZp20FN8UVCRaHYLGm4m0tq0VJhgg7PTdwTksKtmDAF5bEUhIlnUUtbPIfjz5S

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
-- Name: caidat_san; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.caidat_san (
    stmdt_ma character varying(10) NOT NULL,
    cds_ten_hien_thi character varying(100),
    cds_khau_hieu character varying(200),
    cds_logo text,
    cds_favicon text,
    cds_hotline character varying(20),
    cds_email character varying(100),
    cds_dia_chi text,
    cds_ban_quyen character varying(255),
    cds_kieu_header character varying(15) DEFAULT 'logo_trai'::character varying NOT NULL,
    cds_header_dinh boolean DEFAULT true NOT NULL,
    cds_hien_header boolean DEFAULT true NOT NULL,
    cds_hien_footer boolean DEFAULT true NOT NULL,
    cds_cap_nhat_luc timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT caidat_san_cds_kieu_header_check CHECK (((cds_kieu_header)::text = ANY ((ARRAY['logo_trai'::character varying, 'logo_giua'::character varying])::text[])))
);


ALTER TABLE public.caidat_san OWNER TO postgres;

--
-- Name: chitiet_chi_dvvc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chitiet_chi_dvvc (
    pcd_ma character varying(10) NOT NULL,
    dts_ma character varying(10) NOT NULL,
    ccd_so_tien numeric(18,2) NOT NULL
);


ALTER TABLE public.chitiet_chi_dvvc OWNER TO postgres;

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
    ctsp_diemdanhgiatrungbinh numeric(3,2) DEFAULT 0 NOT NULL,
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
-- Name: danhgiashipper; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.danhgiashipper (
    kh_ma character varying(10) NOT NULL,
    dts_ma character varying(10) NOT NULL,
    shipper_ma character varying(10) NOT NULL,
    dgshp_sao smallint NOT NULL,
    dgshp_mota text,
    dgshp_thoidiem timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT danhgiashipper_sao_check CHECK (((dgshp_sao >= 1) AND (dgshp_sao <= 5)))
);


ALTER TABLE public.danhgiashipper OWNER TO postgres;

--
-- Name: danhmucsanpham; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.danhmucsanpham (
    dmsp_ma character varying(10) NOT NULL,
    dmsp_ten character varying(50) NOT NULL,
    dmsp_mota text NOT NULL,
    dmsp_hinhanh text,
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
    dc_ma character varying(10) NOT NULL,
    dvvc_ma character varying(10) NOT NULL,
    kho_hashpass text
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
-- Name: khuvuc_giaodien; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.khuvuc_giaodien (
    kvg_ma character varying(10) NOT NULL,
    stmdt_ma character varying(10) NOT NULL,
    kvg_vitri character varying(10) NOT NULL,
    kvg_ten character varying(50) NOT NULL,
    kvg_tieude character varying(100),
    kvg_kieubocuc character varying(20) DEFAULT 'danh_sach_doc'::character varying NOT NULL,
    kvg_thutu integer DEFAULT 0 NOT NULL,
    kvg_hienthi boolean DEFAULT true NOT NULL,
    kvg_tao_luc timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT khuvuc_giaodien_kvg_kieubocuc_check CHECK (((kvg_kieubocuc)::text = ANY ((ARRAY['menu_ngang'::character varying, 'danh_sach_doc'::character varying, 'luoi_anh'::character varying, 'hang_icon'::character varying, 'doan_text'::character varying])::text[]))),
    CONSTRAINT khuvuc_giaodien_kvg_vitri_check CHECK (((kvg_vitri)::text = ANY ((ARRAY['header'::character varying, 'footer'::character varying])::text[])))
);


ALTER TABLE public.khuvuc_giaodien OWNER TO postgres;

--
-- Name: khuvucvanchuyen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.khuvucvanchuyen (
    kvvc_ma character varying(10) NOT NULL,
    kvvc_ten character varying(50) NOT NULL
);


ALTER TABLE public.khuvucvanchuyen OWNER TO postgres;

--
-- Name: lich_su_chi_tra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lich_su_chi_tra (
    id integer NOT NULL,
    ma_doi_tuong character varying(10) NOT NULL,
    loai_doi_tuong character varying(10) NOT NULL,
    so_tien numeric(18,2) NOT NULL,
    noi_dung text,
    sepay_transaction_id character varying(100),
    trang_thai character varying(20) DEFAULT 'CHO_XU_LY'::character varying,
    ngay_tao timestamp with time zone DEFAULT now()
);


ALTER TABLE public.lich_su_chi_tra OWNER TO postgres;

--
-- Name: lich_su_chi_tra_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lich_su_chi_tra_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lich_su_chi_tra_id_seq OWNER TO postgres;

--
-- Name: lich_su_chi_tra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lich_su_chi_tra_id_seq OWNED BY public.lich_su_chi_tra.id;


--
-- Name: loai_shipper; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loai_shipper (
    lshipper_ma character varying(10) NOT NULL,
    lshipper_ten character varying(50)
);


ALTER TABLE public.loai_shipper OWNER TO postgres;

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
    nh_mota text NOT NULL,
    nh_hinhanh character varying(255)
);


ALTER TABLE public.nganhhang OWNER TO postgres;

--
-- Name: phieu_chi_dvvc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phieu_chi_dvvc (
    pcd_ma character varying(10) NOT NULL,
    dvvc_ma character varying(10) NOT NULL,
    pcd_tong_tien numeric(18,2) NOT NULL,
    pcd_trang_thai character varying(20) DEFAULT 'CHO_THANH_TOAN'::character varying,
    pcd_ngay_tao timestamp with time zone DEFAULT now(),
    pcd_ngay_hoan_tat timestamp with time zone
);


ALTER TABLE public.phieu_chi_dvvc OWNER TO postgres;

--
-- Name: phieu_kho; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phieu_kho (
    pk_ma character varying(20) NOT NULL,
    kho_ma character varying(10) NOT NULL,
    dts_ma character varying(10) NOT NULL,
    pk_loai character varying(10) NOT NULL,
    pk_ly_do character varying(30) NOT NULL,
    shipper_ma character varying(10),
    pk_trangthai character varying(20) DEFAULT 'CHO_XAC_NHAN'::character varying NOT NULL,
    pk_hinhanh text,
    pk_ghichu text,
    pk_thoigian_tao timestamp with time zone DEFAULT now() NOT NULL,
    pk_thoigian_xacnhan timestamp with time zone,
    CONSTRAINT phieu_kho_pk_loai_check CHECK (((pk_loai)::text = ANY ((ARRAY['NHAP'::character varying, 'XUAT'::character varying])::text[]))),
    CONSTRAINT phieu_kho_pk_ly_do_check CHECK (((pk_ly_do)::text = ANY ((ARRAY['TU_LSP01'::character varying, 'TRUNG_CHUYEN_DI'::character varying, 'TRUNG_CHUYEN_DEN'::character varying, 'GIAO_LSP03'::character varying])::text[]))),
    CONSTRAINT phieu_kho_pk_trangthai_check CHECK (((pk_trangthai)::text = ANY ((ARRAY['CHO_XAC_NHAN'::character varying, 'DA_XAC_NHAN'::character varying, 'CO_VAN_DE'::character varying])::text[])))
);


ALTER TABLE public.phieu_kho OWNER TO postgres;

--
-- Name: phieu_kho_nhap_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.phieu_kho_nhap_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.phieu_kho_nhap_seq OWNER TO postgres;

--
-- Name: phieu_kho_xuat_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.phieu_kho_xuat_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.phieu_kho_xuat_seq OWNER TO postgres;

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
-- Name: qr_chi_dvvc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qr_chi_dvvc (
    qr_ma character varying(50) NOT NULL,
    pcd_ma character varying(10) NOT NULL,
    qr_so_tien numeric(18,2) NOT NULL,
    qr_trang_thai character varying(20) DEFAULT 'CHUA_THANH_TOAN'::character varying,
    qr_thoi_diem_tt timestamp with time zone
);


ALTER TABLE public.qr_chi_dvvc OWNER TO postgres;

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
-- Name: sepay_webhook_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sepay_webhook_log (
    sepay_id bigint NOT NULL,
    payload_raw jsonb NOT NULL,
    da_xu_ly boolean DEFAULT false,
    tao_luc timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sepay_webhook_log OWNER TO postgres;

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
    shipper_hashpass text,
    lsp_ma character varying(10),
    CONSTRAINT shipper_shipper_diemdanhgiatrungbinh_check CHECK (((shipper_diemdanhgiatrungbinh >= (0)::numeric) AND (shipper_diemdanhgiatrungbinh <= (5)::numeric)))
);


ALTER TABLE public.shipper OWNER TO postgres;

--
-- Name: so_du_noi_bo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.so_du_noi_bo (
    id integer NOT NULL,
    ma_doi_tuong character varying(10) NOT NULL,
    loai_doi_tuong character varying(10) NOT NULL,
    so_du numeric(18,2) DEFAULT 0 NOT NULL,
    ngay_cap_nhat timestamp with time zone DEFAULT now()
);


ALTER TABLE public.so_du_noi_bo OWNER TO postgres;

--
-- Name: so_du_noi_bo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.so_du_noi_bo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.so_du_noi_bo_id_seq OWNER TO postgres;

--
-- Name: so_du_noi_bo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.so_du_noi_bo_id_seq OWNED BY public.so_du_noi_bo.id;


--
-- Name: thanhphan_giaodien; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thanhphan_giaodien (
    tpg_ma character varying(10) NOT NULL,
    kvg_ma character varying(10) NOT NULL,
    tpg_loai character varying(10) NOT NULL,
    tpg_tieude character varying(100),
    tpg_noidung text,
    tpg_lienket text,
    tpg_hinhanh text,
    tpg_bieutuong character varying(50),
    tpg_mo_tab_moi boolean DEFAULT false NOT NULL,
    tpg_thutu integer DEFAULT 0 NOT NULL,
    tpg_hienthi boolean DEFAULT true NOT NULL,
    tpg_tao_luc timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT thanhphan_giaodien_tpg_loai_check CHECK (((tpg_loai)::text = ANY ((ARRAY['link'::character varying, 'text'::character varying, 'image'::character varying, 'icon'::character varying])::text[])))
);


ALTER TABLE public.thanhphan_giaodien OWNER TO postgres;

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
    ttgh_thoidiem timestamp with time zone,
    ttgh_hinhanh text,
    ttgh_ghichu text,
    shipper_ma character varying(10) NOT NULL,
    ttgh_thoidiemtao timestamp with time zone DEFAULT now() NOT NULL,
    ttgh_da_nop_tien boolean DEFAULT false NOT NULL,
    ttgh_thoidiem_nop timestamp with time zone
);


ALTER TABLE public.thongtingiaohang OWNER TO postgres;

--
-- Name: thongtinlayhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongtinlayhang (
    dts_ma character varying(10) NOT NULL,
    ttlh_thoidiem timestamp with time zone,
    ttlh_hinhanh text,
    ttlh_ghichu text,
    shipper_ma character varying(10) NOT NULL,
    ttlh_thoidiemtao timestamp with time zone DEFAULT now() NOT NULL
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
    ttnt_dvvc_sotaikhoan character varying(14) NOT NULL,
    ttnt_dvvc_tentaikhoan character varying(50),
    sepay_webhook_secret character varying(255)
);


ALTER TABLE public.thongtinnhantien_dvvc OWNER TO postgres;

--
-- Name: thongtinnhantien_gianhang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongtinnhantien_gianhang (
    gh_ma character varying(10) NOT NULL,
    nh_ma character varying(10) CONSTRAINT thongtinnhantien_gianhang_nganhang_ma_not_null NOT NULL,
    ttnt_gianhang_sotaikhoan character varying(14) NOT NULL,
    ttnt_gianhang_tentaikhoan character varying(50),
    sepay_webhook_secret character varying(255)
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
    ttnt_stmdt_sotaikhoan character varying(14) NOT NULL,
    ttnt_stmdt_tentaikhoan character varying(50)
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
-- Name: thongtintrungchuyen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thongtintrungchuyen (
    dts_ma character varying(10) NOT NULL,
    shipper_trungchuyen_ma character varying(10) NOT NULL,
    ttc_thoidiemtao timestamp with time zone DEFAULT now() NOT NULL,
    ttc_thoidiemdi timestamp with time zone,
    ttc_thoidiemden timestamp with time zone,
    ttc_hinhanh text,
    ttc_ghichu text,
    kho_di_ma character varying(10) NOT NULL,
    kho_den_ma character varying(10) NOT NULL
);


ALTER TABLE public.thongtintrungchuyen OWNER TO postgres;

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
    ttdh_ten character varying(50) NOT NULL
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
-- Name: lich_su_chi_tra id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_chi_tra ALTER COLUMN id SET DEFAULT nextval('public.lich_su_chi_tra_id_seq'::regclass);


--
-- Name: so_du_noi_bo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.so_du_noi_bo ALTER COLUMN id SET DEFAULT nextval('public.so_du_noi_bo_id_seq'::regclass);


--
-- Name: caidat_san caidat_san_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caidat_san
    ADD CONSTRAINT caidat_san_pkey PRIMARY KEY (stmdt_ma);


--
-- Name: chitiet_chi_dvvc chitiet_chi_dvvc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiet_chi_dvvc
    ADD CONSTRAINT chitiet_chi_dvvc_pkey PRIMARY KEY (pcd_ma, dts_ma);


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
-- Name: danhgiashipper danhgiashipper_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danhgiashipper
    ADD CONSTRAINT danhgiashipper_pkey PRIMARY KEY (kh_ma, dts_ma);


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
-- Name: khuvuc_giaodien khuvuc_giaodien_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khuvuc_giaodien
    ADD CONSTRAINT khuvuc_giaodien_pkey PRIMARY KEY (kvg_ma);


--
-- Name: khuvucvanchuyen khuvucvanchuyen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khuvucvanchuyen
    ADD CONSTRAINT khuvucvanchuyen_pkey PRIMARY KEY (kvvc_ma);


--
-- Name: lich_su_chi_tra lich_su_chi_tra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_chi_tra
    ADD CONSTRAINT lich_su_chi_tra_pkey PRIMARY KEY (id);


--
-- Name: loai_shipper loai_shipper_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loai_shipper
    ADD CONSTRAINT loai_shipper_pkey PRIMARY KEY (lshipper_ma);


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
-- Name: phieu_chi_dvvc phieu_chi_dvvc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_chi_dvvc
    ADD CONSTRAINT phieu_chi_dvvc_pkey PRIMARY KEY (pcd_ma);


--
-- Name: phieu_kho phieu_kho_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_kho
    ADD CONSTRAINT phieu_kho_pkey PRIMARY KEY (pk_ma);


--
-- Name: phieu_tat_toan phieu_tat_toan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_tat_toan
    ADD CONSTRAINT phieu_tat_toan_pkey PRIMARY KEY (ptt_ma);


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
-- Name: qr_chi_dvvc qr_chi_dvvc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_chi_dvvc
    ADD CONSTRAINT qr_chi_dvvc_pkey PRIMARY KEY (qr_ma);


--
-- Name: qr_thanh_toan qr_thanh_toan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_thanh_toan
    ADD CONSTRAINT qr_thanh_toan_pkey PRIMARY KEY (qr_ma);


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
-- Name: sepay_webhook_log sepay_webhook_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sepay_webhook_log
    ADD CONSTRAINT sepay_webhook_log_pkey PRIMARY KEY (sepay_id);


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
-- Name: so_du_noi_bo so_du_noi_bo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.so_du_noi_bo
    ADD CONSTRAINT so_du_noi_bo_pkey PRIMARY KEY (id);


--
-- Name: so_du_noi_bo so_du_noi_bo_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.so_du_noi_bo
    ADD CONSTRAINT so_du_noi_bo_unique UNIQUE (ma_doi_tuong, loai_doi_tuong);


--
-- Name: thanhphan_giaodien thanhphan_giaodien_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thanhphan_giaodien
    ADD CONSTRAINT thanhphan_giaodien_pkey PRIMARY KEY (tpg_ma);


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
    ADD CONSTRAINT thongtingiaohang_pkey PRIMARY KEY (dts_ma, shipper_ma);


--
-- Name: thongtinlayhang thongtinlayhang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtinlayhang
    ADD CONSTRAINT thongtinlayhang_pkey PRIMARY KEY (dts_ma, shipper_ma);


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
-- Name: thongtintrungchuyen thongtintrungchuyen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtintrungchuyen
    ADD CONSTRAINT thongtintrungchuyen_pkey PRIMARY KEY (dts_ma);


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
-- Name: idx_ctdh_ctsp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ctdh_ctsp ON public.chitietdonhang USING btree (ctsp_ma);


--
-- Name: idx_ctdh_dts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ctdh_dts ON public.chitietdonhang USING btree (dts_ma);


--
-- Name: idx_ctsp_nh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ctsp_nh ON public.chitietsanpham USING btree (nh_ma);


--
-- Name: idx_ctsp_sp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ctsp_sp ON public.chitietsanpham USING btree (sp_ma);


--
-- Name: idx_ctt_dts_ma; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ctt_dts_ma ON public.chitiet_tat_toan USING btree (dts_ma);


--
-- Name: idx_cttdh_dts_thoidiem; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cttdh_dts_thoidiem ON public.chitiettrangthaidonhang USING btree (dts_ma, ctttdh_thoidiem DESC);


--
-- Name: idx_ctttdh_dts_thoidiem; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ctttdh_dts_thoidiem ON public.chitiettrangthaidonhang USING btree (dts_ma, ctttdh_thoidiem DESC);


--
-- Name: idx_ctttdh_ttdh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ctttdh_ttdh ON public.chitiettrangthaidonhang USING btree (ttdh_ma);


--
-- Name: idx_dh_dvvc_ngaylap; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dh_dvvc_ngaylap ON public.donhangtheoshop USING btree (dvvc_ma, dts_ngaylap);


--
-- Name: idx_dh_gh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dh_gh ON public.donhangtheoshop USING btree (gh_ma);


--
-- Name: idx_dh_ngaylap_voucher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dh_ngaylap_voucher ON public.donhangtheoshop USING btree (dts_ngaylap) WHERE (dts_tonggiamgiavanchuyen > (0)::numeric);


--
-- Name: idx_dts_gh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dts_gh ON public.donhangtheoshop USING btree (gh_ma);


--
-- Name: idx_kvg_sapxep; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kvg_sapxep ON public.khuvuc_giaodien USING btree (stmdt_ma, kvg_vitri, kvg_thutu);


--
-- Name: idx_lsct_ngay_tao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lsct_ngay_tao ON public.lich_su_chi_tra USING btree (ngay_tao);


--
-- Name: idx_nganhhang_cha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nganhhang_cha ON public.nganhhang USING btree (nh_cha);


--
-- Name: idx_nh_cha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nh_cha ON public.nganhhang USING btree (nh_cha);


--
-- Name: idx_pcd_ngay_hoan_tat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pcd_ngay_hoan_tat ON public.phieu_chi_dvvc USING btree (pcd_ngay_hoan_tat) WHERE ((pcd_trang_thai)::text = 'DA_THANH_TOAN'::text);


--
-- Name: idx_pcd_trangthai_hoantat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pcd_trangthai_hoantat ON public.phieu_chi_dvvc USING btree (pcd_trang_thai, pcd_ngay_hoan_tat);


--
-- Name: idx_phieu_kho_kho; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_kho_kho ON public.phieu_kho USING btree (kho_ma, pk_loai, pk_ly_do);


--
-- Name: idx_phieu_kho_trangthai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_kho_trangthai ON public.phieu_kho USING btree (kho_ma, pk_trangthai);


--
-- Name: idx_ptt_hoantat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ptt_hoantat ON public.phieu_tat_toan USING btree (ptt_thoi_diem_hoan_tat) WHERE ((ptt_trang_thai_thanh_toan)::text = 'DA_THANH_TOAN'::text);


--
-- Name: idx_ptt_kho_hoantat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ptt_kho_hoantat ON public.phieu_tat_toan USING btree (kho_ma, ptt_thoi_diem_hoan_tat) WHERE ((ptt_trang_thai_thanh_toan)::text = 'DA_THANH_TOAN'::text);


--
-- Name: idx_qr_ma_giao_dich; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_ma_giao_dich ON public.qr_thanh_toan USING btree (qr_ma_giao_dich);


--
-- Name: idx_qr_ptt_ma; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_ptt_ma ON public.qr_thanh_toan USING btree (ptt_ma);


--
-- Name: idx_shipper_kho; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shipper_kho ON public.shipper USING btree (kho_ma);


--
-- Name: idx_sp_gh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sp_gh ON public.sanpham USING btree (gh_ma);


--
-- Name: idx_tpg_sapxep; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tpg_sapxep ON public.thanhphan_giaodien USING btree (kvg_ma, tpg_thutu);


--
-- Name: idx_ttgh_thoidiem_nop; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ttgh_thoidiem_nop ON public.thongtingiaohang USING btree (ttgh_thoidiem_nop) WHERE (ttgh_da_nop_tien = true);


--
-- Name: uk_phieu_kho_dts_lydo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uk_phieu_kho_dts_lydo ON public.phieu_kho USING btree (dts_ma, pk_ly_do);


--
-- Name: caidat_san caidat_san_stmdt_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caidat_san
    ADD CONSTRAINT caidat_san_stmdt_ma_fkey FOREIGN KEY (stmdt_ma) REFERENCES public.san_thuong_mai_dien_tu(stmdt_ma) ON DELETE CASCADE;


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
-- Name: danhgiashipper danhgiashipper_dts_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danhgiashipper
    ADD CONSTRAINT danhgiashipper_dts_fkey FOREIGN KEY (dts_ma) REFERENCES public.donhangtheoshop(dts_ma) ON DELETE CASCADE;


--
-- Name: danhgiashipper danhgiashipper_kh_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danhgiashipper
    ADD CONSTRAINT danhgiashipper_kh_fkey FOREIGN KEY (kh_ma) REFERENCES public.khachhang(kh_ma);


--
-- Name: danhgiashipper danhgiashipper_shipper_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danhgiashipper
    ADD CONSTRAINT danhgiashipper_shipper_fkey FOREIGN KEY (shipper_ma) REFERENCES public.shipper(shipper_ma);


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
-- Name: chitiet_chi_dvvc fk_ccd_dts; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiet_chi_dvvc
    ADD CONSTRAINT fk_ccd_dts FOREIGN KEY (dts_ma) REFERENCES public.donhangtheoshop(dts_ma);


--
-- Name: chitiet_chi_dvvc fk_ccd_pcd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chitiet_chi_dvvc
    ADD CONSTRAINT fk_ccd_pcd FOREIGN KEY (pcd_ma) REFERENCES public.phieu_chi_dvvc(pcd_ma) ON DELETE CASCADE;


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
-- Name: phieu_chi_dvvc fk_pcd_dvvc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_chi_dvvc
    ADD CONSTRAINT fk_pcd_dvvc FOREIGN KEY (dvvc_ma) REFERENCES public.donvivanchuyen(dvvc_ma);


--
-- Name: phieu_tat_toan fk_ptt_kho; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_tat_toan
    ADD CONSTRAINT fk_ptt_kho FOREIGN KEY (kho_ma) REFERENCES public.kho(kho_ma);


--
-- Name: qr_chi_dvvc fk_qr_pcd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_chi_dvvc
    ADD CONSTRAINT fk_qr_pcd FOREIGN KEY (pcd_ma) REFERENCES public.phieu_chi_dvvc(pcd_ma) ON DELETE CASCADE;


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
-- Name: khuvuc_giaodien khuvuc_giaodien_stmdt_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khuvuc_giaodien
    ADD CONSTRAINT khuvuc_giaodien_stmdt_ma_fkey FOREIGN KEY (stmdt_ma) REFERENCES public.san_thuong_mai_dien_tu(stmdt_ma) ON DELETE CASCADE;


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
-- Name: phieu_kho phieu_kho_dts_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_kho
    ADD CONSTRAINT phieu_kho_dts_ma_fkey FOREIGN KEY (dts_ma) REFERENCES public.donhangtheoshop(dts_ma) ON DELETE CASCADE;


--
-- Name: phieu_kho phieu_kho_kho_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_kho
    ADD CONSTRAINT phieu_kho_kho_ma_fkey FOREIGN KEY (kho_ma) REFERENCES public.kho(kho_ma);


--
-- Name: phieu_kho phieu_kho_shipper_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_kho
    ADD CONSTRAINT phieu_kho_shipper_ma_fkey FOREIGN KEY (shipper_ma) REFERENCES public.shipper(shipper_ma);


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
-- Name: qr_thanh_toan qr_thanh_toan_ptt_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_thanh_toan
    ADD CONSTRAINT qr_thanh_toan_ptt_ma_fkey FOREIGN KEY (ptt_ma) REFERENCES public.phieu_tat_toan(ptt_ma);


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
-- Name: shipper shipper_lsp_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipper
    ADD CONSTRAINT shipper_lsp_ma_fkey FOREIGN KEY (lsp_ma) REFERENCES public.loai_shipper(lshipper_ma);


--
-- Name: thanhphan_giaodien thanhphan_giaodien_kvg_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thanhphan_giaodien
    ADD CONSTRAINT thanhphan_giaodien_kvg_ma_fkey FOREIGN KEY (kvg_ma) REFERENCES public.khuvuc_giaodien(kvg_ma) ON DELETE CASCADE;


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
-- Name: thongtintrungchuyen thongtintrungchuyen_dts_ma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtintrungchuyen
    ADD CONSTRAINT thongtintrungchuyen_dts_ma_fkey FOREIGN KEY (dts_ma) REFERENCES public.donhangtheoshop(dts_ma) ON DELETE CASCADE;


--
-- Name: thongtintrungchuyen thongtintrungchuyen_khodenma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtintrungchuyen
    ADD CONSTRAINT thongtintrungchuyen_khodenma_fkey FOREIGN KEY (kho_den_ma) REFERENCES public.kho(kho_ma);


--
-- Name: thongtintrungchuyen thongtintrungchuyen_khodima_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtintrungchuyen
    ADD CONSTRAINT thongtintrungchuyen_khodima_fkey FOREIGN KEY (kho_di_ma) REFERENCES public.kho(kho_ma);


--
-- Name: thongtintrungchuyen thongtintrungchuyen_shipper_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thongtintrungchuyen
    ADD CONSTRAINT thongtintrungchuyen_shipper_fkey FOREIGN KEY (shipper_trungchuyen_ma) REFERENCES public.shipper(shipper_ma);


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

\unrestrict VvZp20FN8UVCRaHYLGm4m0tq0VJhgg7PTdwTksKtmDAF5bEUhIlnUUtbPIfjz5S

