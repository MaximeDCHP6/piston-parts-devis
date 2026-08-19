import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Les pièces jointes (factures, devis ERP scannés) dépassent
      // largement la limite par défaut de 1 Mo des Server Actions.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
