import type { NextConfig } from "next";

// Identificador do deploy: usado para proteção contra "version skew".
// Quando o cliente está numa versão antiga e o servidor já mudou, o Next.js
// faz um reload automático em vez de lançar "Failed to find Server Action".
// No Vercel, VERCEL_DEPLOYMENT_ID/VERCEL_GIT_COMMIT_SHA estão disponíveis no build.
const deploymentId =
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  undefined;

const nextConfig: NextConfig = {
  ...(deploymentId ? { deploymentId } : {}),
};

export default nextConfig;
