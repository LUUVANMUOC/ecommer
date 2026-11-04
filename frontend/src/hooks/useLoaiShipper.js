// src/hooks/useLoaiShipper.js
import { useState, useEffect } from 'react';
import loaiShipperService from '../services/san/loaiShipperService';

// Cache module-level: bảng tĩnh 3 dòng, chỉ fetch 1 lần / session
let cachedData = null;
let inflight = null;

const fetchOnce = () => {
  if (cachedData) return Promise.resolve(cachedData);
  if (inflight) return inflight;

  inflight = loaiShipperService
    .getAll()
    .then((res) => {
      cachedData = res.data;
      inflight = null;
      return cachedData;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });

  return inflight;
};

export const useLoaiShipper = () => {
  const [data, setData] = useState(cachedData || []);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchOnce()
      .then((d) => {
        if (mounted) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(e);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
};

export default useLoaiShipper;