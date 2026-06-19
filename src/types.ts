export interface SupportingOfficer {
  name: string;
  mobile: string;
}

export interface OfficerRecord {
  id: string;
  dutyType: string;           // e.g. "बैरियर ड्यूटी"
  mainOfficerName: string;    // e.g. "उ0नि0 श्री विजेन्द्र सिंह थाना को0देहात"
  mainOfficerMobile: string;
  supportingOfficers: SupportingOfficer[];   // can be 0 to N
  dutyPlace: string;          // e.g. "मामन तिराहा"
  thanaArea: string;          // e.g. "कोतवाली देहात"
  dutyTime: string;           // e.g. "प्रातः 08 बजे से रात्रि 20:00 बजे तक"
  zonalMagistrate: string;    // right column - can be blank
  zonalPoliceOfficer: string; // right column - can be blank
  sectorMagistrate: string;   // right column - can be blank
  sectorPoliceOfficer: string;// right column - can be blank
}

export interface ExtractionResult {
  eventName: string;     // "काँवड़ यात्रा-2025"
  district: string;      // "बुलन्दशहर"
  dutyDateFrom: string;  // "11.07.2025"
  dutyDateTo: string;    // "24.07.2025"
  records: OfficerRecord[];
}
