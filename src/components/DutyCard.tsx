import React from 'react';
import { OfficerRecord } from '../types';

interface DutyCardProps {
  record: OfficerRecord;
  eventName: string;
  district: string;
  dutyDateFrom: string;
  dutyDateTo: string;
}

export const DutyCard: React.FC<DutyCardProps> = ({
  record,
  eventName,
  district,
  dutyDateFrom,
  dutyDateTo,
}) => {
  // Ensure we have at least 2 supporting rows (matching original Excel card)
  const displaySupporting = [...record.supportingOfficers];
  while (displaySupporting.length < 2) {
    displaySupporting.push({ name: '', mobile: '' });
  }

  const N = displaySupporting.length;

  // Column A "ड्यूटी का प्रकार" spans: main officer + supporting header + all supporting officers
  const dutyTypeRowSpan = 1 + 1 + N; // = N + 2

  // Column D zonal magistrate VALUE spans: main officer + supporting header + (N-1) supporting
  // The last supporting row gets a new D cell (the "जोनल पुलिस अधिकारी" label)
  const zonalMagRowSpan = 1 + 1 + (N - 1); // = N + 1

  return (
    <div
      className="duty-card-container w-full max-w-[850px] bg-white border-2 border-black text-black mx-auto select-none print:max-w-full"
      style={{ fontFamily: "'Noto Sans Devanagari', 'Mangal', sans-serif" }}
    >
      {/* SINGLE TABLE — mirrors the Excel 4-column layout exactly */}
      <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '17%' }} />
          <col style={{ width: '33%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '35%' }} />
        </colgroup>
        <tbody>

          {/* ============================================ */}
          {/* HEADER ROW 1: Title text (A-C merged) + Logo (D) */}
          {/* ============================================ */}
          <tr>
            <td
              colSpan={3}
              className="text-center px-4 pt-4 pb-2 align-middle"
              style={{ borderBottom: 'none' }}
            >
              <div className="text-[26px] font-extrabold leading-tight tracking-wide">
                {eventName || 'काँवड़ यात्रा—2025'}
              </div>
              <div className="text-[19px] font-bold leading-tight mt-1">
                ड्यूटी कार्ड जनपद {district || 'बुलन्दशहर'}
              </div>
            </td>
            <td
              rowSpan={2}
              className="text-center align-middle border-l border-black p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/up_police_logo.png"
                alt="UP Police Logo"
                className="mx-auto"
                style={{ width: '130px', height: 'auto' }}
              />
            </td>
          </tr>

          {/* ============================================ */}
          {/* HEADER ROW 2: Duty date (A-C merged) */}
          {/* ============================================ */}
          <tr>
            <td
              colSpan={3}
              className="text-center px-4 py-2 align-middle border-t border-b border-black"
            >
              <div className="text-[17px] font-bold leading-tight">
                ड्यूटी दिनांक {dutyDateFrom || '11.07.2025'} से{' '}
                {dutyDateTo || '24.07.2025'} तक
              </div>
            </td>
          </tr>

          {/* ============================================ */}
          {/* TABLE ROW 1: Column headers */}
          {/* ============================================ */}
          <tr>
            <td className="border-b border-r border-black px-2 py-2 text-center font-bold align-middle text-[13px]">
              ड्यूटी का प्रकार
            </td>
            <td className="border-b border-r border-black px-2 py-2 text-center font-bold align-middle text-[13px]">
              ड्यूटी अधिकारी/कर्मचारी का नाम
            </td>
            <td className="border-b border-r border-black px-2 py-2 text-center font-bold align-middle text-[13px]">
              मो0नं0
            </td>
            <td className="border-b border-l-2 border-black px-2 py-2 text-center font-bold align-middle text-[13px]">
              जोनल मजि0 का नाम व मो0नं0
            </td>
          </tr>

          {/* ============================================ */}
          {/* TABLE ROW 2: Main duty officer */}
          {/* ============================================ */}
          <tr>
            {/* Column A: Duty type — spans all officer rows */}
            <td
              rowSpan={dutyTypeRowSpan}
              className="border-b border-r border-black px-2 py-2 font-bold text-center align-middle text-[13px]"
            >
              {record.dutyType}
            </td>
            {/* Column B: Officer name */}
            <td className="border-b border-r border-black px-2 py-2 font-semibold align-middle text-[12.5px]">
              {record.mainOfficerName}
            </td>
            {/* Column C: Mobile */}
            <td className="border-b border-r border-black px-2 py-2 text-center align-middle text-[12.5px]">
              {record.mainOfficerMobile}
            </td>
            {/* Column D: Zonal magistrate VALUE — spans until last supporting row */}
            <td
              rowSpan={zonalMagRowSpan}
              className="border-b border-l-2 border-black px-3 py-2 text-center align-middle text-[12px] font-semibold"
            >
              {record.zonalMagistrate || '\u00A0'}
            </td>
          </tr>

          {/* ============================================ */}
          {/* TABLE ROW 3: Supporting staff sub-header */}
          {/* ============================================ */}
          <tr>
            <td className="border-b border-r border-black px-2 py-1.5 font-bold text-center align-middle text-[12px]">
              सहयोगी पुलिसकर्मियों के नाम
            </td>
            <td className="border-b border-r border-black px-2 py-1.5 font-bold text-center align-middle text-[12px]">
              मो0नं0
            </td>
            {/* Column D covered by zonal magistrate rowSpan */}
          </tr>

          {/* ============================================ */}
          {/* TABLE ROWS 4+: Supporting officers */}
          {/* ============================================ */}
          {displaySupporting.map((officer, index) => {
            const isLast = index === N - 1;
            return (
              <tr key={index}>
                {/* Column B: Name */}
                <td className="border-b border-r border-black px-2 py-2 align-middle text-[12.5px]">
                  {officer.name || '\u00A0'}
                </td>
                {/* Column C: Mobile */}
                <td className="border-b border-r border-black px-2 py-2 text-center align-middle text-[12.5px]">
                  {officer.mobile || '\u00A0'}
                </td>
                {/* Column D: Only the LAST supporting row gets a new D cell
                    (zonal magistrate rowSpan ended on the row before this) */}
                {isLast && (
                  <td className="border-b border-l-2 border-black px-2 py-2 text-center align-middle font-bold text-[12px]">
                    जोनल पुलिस अधिकारी नाम व मो0नं0
                  </td>
                )}
                {/* All other rows: Column D is covered by the zonal magistrate rowSpan */}
              </tr>
            );
          })}

          {/* ============================================ */}
          {/* ड्यूटी का स्थान — Label row */}
          {/* ============================================ */}
          <tr>
            <td className="border-b border-r border-black px-2 py-2 font-bold align-middle text-[13px]">
              ड्यूटी का स्थान
            </td>
            <td className="border-b border-r border-black px-2 py-2">{'\u00A0'}</td>
            <td className="border-b border-r border-black px-2 py-2">{'\u00A0'}</td>
            {/* Column D: Zonal police officer VALUE */}
            <td
              rowSpan={2}
              className="border-b border-l-2 border-black px-3 py-2 text-center align-middle text-[12px] font-semibold"
            >
              {record.zonalPoliceOfficer || '\u00A0'}
            </td>
          </tr>

          {/* ============================================ */}
          {/* ड्यूटी का स्थान — Value row */}
          {/* ============================================ */}
          <tr>
            <td className="border-b border-r border-black px-2 py-2 font-semibold align-middle text-[13px]">
              {record.dutyPlace}
            </td>
            <td className="border-b border-r border-black px-2 py-2">{'\u00A0'}</td>
            <td className="border-b border-r border-black px-2 py-2">{'\u00A0'}</td>
          </tr>

          {/* ============================================ */}
          {/* थाना क्षेत्र — Label row */}
          {/* ============================================ */}
          <tr>
            <td className="border-b border-r border-black px-2 py-2 font-bold align-middle text-[13px]">
              थाना क्षेत्र
            </td>
            <td className="border-b border-r border-black px-2 py-2">{'\u00A0'}</td>
            <td className="border-b border-r border-black px-2 py-2">{'\u00A0'}</td>
            {/* Column D: Sector magistrate LABEL */}
            <td className="border-b border-l-2 border-black px-2 py-2 text-center align-middle font-bold text-[12px]">
              सेक्टर मजि0 का नाम व मो0नं0
            </td>
          </tr>

          {/* ============================================ */}
          {/* थाना क्षेत्र — Value row */}
          {/* ============================================ */}
          <tr>
            <td className="border-b border-r border-black px-2 py-2 font-semibold align-middle text-[13px]">
              {record.thanaArea}
            </td>
            <td className="border-b border-r border-black px-2 py-2">{'\u00A0'}</td>
            <td className="border-b border-r border-black px-2 py-2">{'\u00A0'}</td>
            {/* Column D: Sector magistrate VALUE */}
            <td
              rowSpan={2}
              className="border-b border-l-2 border-black px-3 py-2 text-center align-middle text-[12px] font-semibold"
            >
              {record.sectorMagistrate || '\u00A0'}
            </td>
          </tr>

          {/* ============================================ */}
          {/* ड्यूटी का समय — Label row */}
          {/* ============================================ */}
          <tr>
            <td className="border-b border-r border-black px-2 py-2 font-bold align-middle text-[13px]">
              ड्यूटी का समय
            </td>
            <td className="border-b border-r border-black px-2 py-2">{'\u00A0'}</td>
            <td className="border-b border-r border-black px-2 py-2">{'\u00A0'}</td>
          </tr>

          {/* ============================================ */}
          {/* ड्यूटी का समय — Value row */}
          {/* ============================================ */}
          <tr>
            <td className="border-b border-r border-black px-2 py-2 font-semibold align-middle text-[12.5px] leading-snug">
              {record.dutyTime}
            </td>
            <td className="border-b border-r border-black px-2 py-2">{'\u00A0'}</td>
            <td className="border-b border-r border-black px-2 py-2">{'\u00A0'}</td>
            {/* Column D: Sector police officer LABEL */}
            <td className="border-b border-l-2 border-black px-2 py-2 text-center align-middle font-bold text-[12px]">
              सेक्टर पुलिस अधिकारी का नाम/मो0नं0
            </td>
          </tr>

          {/* ============================================ */}
          {/* Spacer row + Sector police officer VALUE */}
          {/* ============================================ */}
          <tr>
            <td className="border-r border-black px-2 py-4">{'\u00A0'}</td>
            <td className="border-r border-black px-2 py-4">{'\u00A0'}</td>
            <td className="border-r border-black px-2 py-4">{'\u00A0'}</td>
            <td className="border-l-2 border-black px-3 py-4 text-center align-middle text-[12px] font-semibold">
              {record.sectorPoliceOfficer || '\u00A0'}
            </td>
          </tr>

          {/* ============================================ */}
          {/* FOOTER ROW */}
          {/* ============================================ */}
          <tr>
            <td colSpan={4} className="px-6 pt-4 pb-3 text-right align-bottom">
              <span className="font-bold text-[14px] leading-snug">
                वरिष्ठ पुलिस अधीक्षक,
              </span>
              <br />
              <span className="font-bold text-[14px] leading-snug">
                जनपद—बुलन्दशहर
              </span>
            </td>
          </tr>

        </tbody>
      </table>
    </div>
  );
};
