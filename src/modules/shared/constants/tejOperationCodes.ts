// Official TEJ / RiTEJ IdTypeOperation table (DGI cahier de charges v1.0).
// Code pattern: RSn_NNNNNN  (n = family group).
// Default rates are usual practice; the actual rate is always carried on the certificat.
import type { RSTypeCode } from '../types/retenue-source';

export type TejOperationFamily =
  | 'Honoraires'
  | 'Loyers'
  | 'Marchés'
  | 'Redevances'
  | 'Intérêts'
  | 'Plus-values'
  | 'Jeux'
  | 'Salaires'
  | 'Exonérations';

export interface TejOperationCode {
  code: string;
  labelFr: string;
  defaultRate: number | null;   // null => variable (e.g. salary barème) or exoneré
  family: TejOperationFamily;
}

export const TEJ_OPERATION_CODES: TejOperationCode[] = [
  // RS1 — Honoraires & services
  { code: 'RS1_000001', labelFr: "Honoraires - personnes morales / loi commune", defaultRate: 3,    family: 'Honoraires' },
  { code: 'RS1_000002', labelFr: "Honoraires - personnes physiques",             defaultRate: 10,   family: 'Honoraires' },
  { code: 'RS1_000003', labelFr: "Honoraires - non résidents",                   defaultRate: 15,   family: 'Honoraires' },
  { code: 'RS1_000004', labelFr: "Commissions, courtages, vacations",            defaultRate: 15,   family: 'Honoraires' },
  { code: 'RS1_000005', labelFr: "Loyers",                                       defaultRate: 10,   family: 'Loyers' },
  { code: 'RS1_000006', labelFr: "Loyers - non résidents",                       defaultRate: 15,   family: 'Loyers' },
  // RS2 — Marchés
  { code: 'RS2_000001', labelFr: "Montants >= 1000 TND TTC",                     defaultRate: 1,    family: 'Marchés' },
  { code: 'RS2_000002', labelFr: "Marchés conclus avec l'État / collectivités",  defaultRate: 1.5,  family: 'Marchés' },
  // RS3 — Redevances, intérêts, plus-values
  { code: 'RS3_000001', labelFr: "Redevances - non résidents",                   defaultRate: 15,   family: 'Redevances' },
  { code: 'RS3_000002', labelFr: "Intérêts des prêts payés à l'étranger",       defaultRate: 20,   family: 'Intérêts' },
  { code: 'RS3_000003', labelFr: "Intérêts servis aux banques non résidentes",   defaultRate: 5,    family: 'Intérêts' },
  { code: 'RS3_000004', labelFr: "Plus-values immobilières",                     defaultRate: 2.5,  family: 'Plus-values' },
  // RS4 — Jeux
  { code: 'RS4_000001', labelFr: "Lots de loterie / jeux",                       defaultRate: 25,   family: 'Jeux' },
  // RS5 — Salaires
  { code: 'RS5_000001', labelFr: "Salaires & assimilés (barème IRPP)",           defaultRate: null, family: 'Salaires' },
  // RS6 — Exonérations
  { code: 'RS6_000001', labelFr: "Exonération par convention bilatérale",        defaultRate: 0,    family: 'Exonérations' },
];

export const TEJ_OPERATION_BY_FAMILY = TEJ_OPERATION_CODES.reduce<Record<string, TejOperationCode[]>>(
  (acc, op) => {
    (acc[op.family] ??= []).push(op);
    return acc;
  },
  {},
);

export function getTejOperation(code: string | undefined | null): TejOperationCode | undefined {
  return code ? TEJ_OPERATION_CODES.find(o => o.code === code) : undefined;
}

/** Map legacy 2-char rate codes to the closest official IdTypeOperation. */
export function legacyToTejOperationCode(legacy: RSTypeCode | string | undefined | null): string {
  switch (legacy) {
    case '10': return 'RS1_000002';
    case '05': return 'RS3_000003';
    case '03': return 'RS1_000001';
    case '20': return 'RS3_000002';
    case 'P1': return 'RS2_000002';
    case 'P2': return 'RS3_000003';
    case 'P3': return 'RS1_000002';
    case 'P4': return 'RS1_000003';
    case 'P5': return 'RS4_000001';
    default:   return 'RS1_000001';
  }
}
