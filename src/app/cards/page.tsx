'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ExtractionResult, OfficerRecord } from '../../types';
import { DutyCard } from '../../components/DutyCard';
import { EditCardModal } from '../../components/EditCardModal';

export default function CardsPage() {
  const [data, setData] = useState<ExtractionResult | null>(null);
  const [editingRecord, setEditingRecord] = useState<OfficerRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('duty_cards_result');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse saved data:', err);
      }
    }
  }, []);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400">ड्यूटी कार्ड डेटा लोड हो रहा है...</p>
      </main>
    );
  }

  const updateEventField = (field: keyof ExtractionResult, value: string) => {
    setData((prev) => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };
      localStorage.setItem('duty_cards_result', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveRecord = (updatedRecord: OfficerRecord) => {
    setData((prev) => {
      if (!prev) return null;
      const updatedRecords = prev.records.map((r) =>
        r.id === updatedRecord.id ? updatedRecord : r
      );
      const updated = { ...prev, records: updatedRecords };
      localStorage.setItem('duty_cards_result', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('क्या आप इस ड्यूटी कार्ड को हटाना चाहते हैं?')) {
      setData((prev) => {
        if (!prev) return null;
        const updatedRecords = prev.records.filter((r) => r.id !== id);
        const updated = { ...prev, records: updatedRecords };
        localStorage.setItem('duty_cards_result', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handlePrintAll = () => {
    document.body.classList.remove('printing-single');
    document.body.classList.add('printing-all');
    window.print();
  };

  const handlePrintSingle = (id: string) => {
    // Clear any previous print classes on elements
    document.querySelectorAll('.duty-card-container').forEach((el) => {
      el.classList.remove('printing-now');
    });

    const target = document.getElementById(`card-${id}`);
    if (target) {
      target.classList.add('printing-now');
    }

    document.body.classList.remove('printing-all');
    document.body.classList.add('printing-single');
    window.print();
  };

  // Filter records based on search term (match thana, place, officer name, or type)
  const filteredRecords = data.records.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.mainOfficerName.toLowerCase().includes(term) ||
      r.dutyPlace.toLowerCase().includes(term) ||
      r.thanaArea.toLowerCase().includes(term) ||
      r.dutyType.toLowerCase().includes(term)
    );
  });

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 print:bg-white print:text-black print:p-0">
      {/* HEADER CONTROLS (Hidden in Print) */}
      <div className="max-w-6xl mx-auto mb-8 bg-slate-950/40 border border-slate-800 rounded-2xl p-6 space-y-6 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">जनरेट किए गए ड्यूटी कार्ड्स</h1>
            <p className="text-sm text-slate-400 mt-1">
              कुल {data.records.length} ड्यूटी समूह पाए गए ({filteredRecords.length} प्रदर्शित)
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/upload')}
              className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-xl text-sm font-semibold transition-colors"
            >
              &larr; नया अपलोड
            </button>
            <button
              onClick={handlePrintAll}
              disabled={filteredRecords.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold shadow-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
              </svg>
              सभी कार्ड प्रिंट करें (Print All)
            </button>
          </div>
        </div>

        {/* Global Event Metadata Edit Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">कार्यक्रम का नाम</label>
            <input
              type="text"
              value={data.eventName}
              onChange={(e) => updateEventField('eventName', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">जनपद</label>
            <input
              type="text"
              value={data.district}
              onChange={(e) => updateEventField('district', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ड्यूटी प्रारंभ दिनांक</label>
            <input
              type="text"
              value={data.dutyDateFrom}
              onChange={(e) => updateEventField('dutyDateFrom', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ड्यूटी समाप्ति दिनांक</label>
            <input
              type="text"
              value={data.dutyDateTo}
              onChange={(e) => updateEventField('dutyDateTo', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="अधिकारी का नाम, ड्यूटी स्थान, थाना क्षेत्र या ड्यूटी प्रकार खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* CARDS LIST CONTAINER */}
      <div className="max-w-6xl mx-auto space-y-12 pb-16 print:space-y-0 print:pb-0">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-500 print:hidden">
            कोई कार्ड मेल नहीं खाता।
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className="card-container-wrapper bg-slate-950/20 border border-slate-800/40 p-6 rounded-2xl space-y-4 print:p-0 print:border-none print:bg-transparent"
            >
              {/* Card Title & Action Buttons (Hidden in Print) */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/40 px-4 py-3 rounded-xl border border-slate-800 print:hidden">
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">स्थान:</span> {record.dutyPlace} |{' '}
                  <span className="font-semibold text-slate-200">थाना:</span> {record.thanaArea}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setEditingRecord(record);
                      setIsEditModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    सुधारें (Edit)
                  </button>
                  <button
                    onClick={() => handlePrintSingle(record.id)}
                    className="flex-1 sm:flex-initial px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                    </svg>
                    प्रिंट (Print)
                  </button>
                  <button
                    onClick={() => handleDeleteRecord(record.id)}
                    className="px-2 py-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/60 rounded-lg transition-colors flex items-center justify-center"
                    title="हटाएं"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* RENDERED PIXEL-PERFECT CARD */}
              <div id={`card-${record.id}`} className="duty-card-wrapper bg-white rounded-lg p-2 print:p-0 print:rounded-none">
                <DutyCard
                  record={record}
                  eventName={data.eventName}
                  district={data.district}
                  dutyDateFrom={data.dutyDateFrom}
                  dutyDateTo={data.dutyDateTo}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT MODAL */}
      {editingRecord && (
        <EditCardModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRecord(null);
          }}
          record={editingRecord}
          onSave={handleSaveRecord}
        />
      )}
    </main>
  );
}
