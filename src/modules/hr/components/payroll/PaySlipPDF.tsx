import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { SalaryBreakdown } from '../../types/hr.types';

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10 },
  title: { fontSize: 14, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#444' },
  value: { fontWeight: 700 as any },
  section: { marginTop: 12 },
});

export function PaySlipPDF(props: {
  breakdown: SalaryBreakdown;
  month: number;
  year: number;
  employeeName: string;
  labels?: {
    title: string;
    employee: string;
    period: string;
    gross: string;
    overtime?: string;
    absenceDeduction?: string;

    cnss: string;
    taxableGross: string;
    abattement: string;
    taxableBase: string;
    irpp: string;
    css: string;
    net: string;
  };
}) {
  const { breakdown: b } = props;
  const labels = props.labels;
  const overtimeHours = Number(b.overtimeHours ?? 0);
  const overtimeAmount = Number(b.overtimeAmount ?? 0);
  const hasOvertime = overtimeHours > 0 || overtimeAmount > 0;
  const unpaidDays = Number(b.unpaidDays ?? 0);
  const absenceDeduction = Number(b.absenceDeduction ?? 0);
  const hasAbsenceDeduction = unpaidDays > 0 || absenceDeduction > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{labels?.title ?? 'Pay slip / Fiche de paie'}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{labels?.employee ?? 'Employee / Employé'}</Text>
          <Text style={styles.value}>{props.employeeName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{labels?.period ?? 'Period / Période'}</Text>
          <Text style={styles.value}>{props.month}/{props.year}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}><Text style={styles.label}>{labels?.gross ?? 'Gross / Brut'}</Text><Text style={styles.value}>{b.grossSalary.toFixed(3)} TND</Text></View>
          {hasOvertime ? (
            <View style={styles.row}>
              <Text style={styles.label}>
                {(labels?.overtime ?? 'Overtime / Heures sup.')} ({overtimeHours.toFixed(2)} h)
              </Text>
              <Text style={styles.value}>{overtimeAmount.toFixed(3)} TND</Text>
            </View>
          ) : null}
          {hasAbsenceDeduction ? (
            <View style={styles.row}>
              <Text style={styles.label}>
                {(labels?.absenceDeduction ?? 'Unpaid absence / Absence non payée')} ({unpaidDays.toFixed(2)} j)
              </Text>
              <Text style={styles.value}>-{absenceDeduction.toFixed(3)} TND</Text>
            </View>
          ) : null}
          <View style={styles.row}><Text style={styles.label}>{labels?.cnss ?? 'CNSS'}</Text><Text style={styles.value}>{b.cnss.toFixed(3)} TND</Text></View>
          <View style={styles.row}><Text style={styles.label}>{labels?.taxableGross ?? 'Taxable gross / Brut imposable'}</Text><Text style={styles.value}>{b.taxableGross.toFixed(3)} TND</Text></View>
          <View style={styles.row}><Text style={styles.label}>{labels?.abattement ?? 'Abattement'}</Text><Text style={styles.value}>{b.abattement.toFixed(3)} TND</Text></View>
          <View style={styles.row}><Text style={styles.label}>{labels?.taxableBase ?? 'Taxable base / Base imposable'}</Text><Text style={styles.value}>{b.taxableBase.toFixed(3)} TND</Text></View>
          <View style={styles.row}><Text style={styles.label}>{labels?.irpp ?? 'IRPP'}</Text><Text style={styles.value}>{b.irpp.toFixed(3)} TND</Text></View>
          <View style={styles.row}><Text style={styles.label}>{labels?.css ?? 'CSS'}</Text><Text style={styles.value}>{b.css.toFixed(3)} TND</Text></View>
          <View style={styles.row}><Text style={styles.label}>{labels?.net ?? 'Net / Net'}</Text><Text style={styles.value}>{b.netSalary.toFixed(3)} TND</Text></View>
        </View>
      </Page>
    </Document>
  );
}

