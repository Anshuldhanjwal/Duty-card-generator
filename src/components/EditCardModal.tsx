import React, { useState, useEffect } from 'react';
import { OfficerRecord } from '../types';

interface EditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: OfficerRecord;
  onSave: (updatedRecord: OfficerRecord) => void;
}

export const EditCardModal: React.FC<EditCardModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave,
}) => {
  const [editedRecord, setEditedRecord] = useState<OfficerRecord>(() => ({
    ...record,
    supportingOfficers: record.supportingOfficers ?? [],
    zonalMagistrate: record.zonalMagistrate ?? '',
    zonalPoliceOfficer: record.zonalPoliceOfficer ?? '',
    sectorMagistrate: record.sectorMagistrate ?? '',
    sectorPoliceOfficer: record.sectorPoliceOfficer ?? '',
  }));

  useEffect(() => {
    setEditedRecord({
      ...record,
      supportingOfficers: record.supportingOfficers ?? [],
      zonalMagistrate: record.zonalMagistrate ?? '',
      zonalPoliceOfficer: record.zonalPoliceOfficer ?? '',
      sectorMagistrate: record.sectorMagistrate ?? '',
      sectorPoliceOfficer: record.sectorPoliceOfficer ?? '',
    });
  }, [record, isOpen]);

  if (!isOpen) return null;

  const safeInputValue = (value: string | null | undefined) => value ?? '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedRecord((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSupportingChange = (index: number, field: 'name' | 'mobile', value: string) => {
    const updatedSupporting = [...editedRecord.supportingOfficers];
    updatedSupporting[index] = {
      ...updatedSupporting[index],
      [field]: value,
    };
    setEditedRecord((prev) => ({
      ...prev,
      supportingOfficers: updatedSupporting,
    }));
  };

  const addSupportingOfficer = () => {
    setEditedRecord((prev) => ({
      ...prev,
      supportingOfficers: [...prev.supportingOfficers, { name: '', mobile: '' }],
    }));
  };

  const removeSupportingOfficer = (index: number) => {
    const updatedSupporting = editedRecord.supportingOfficers.filter((_, i) => i !== index);
    setEditedRecord((prev) => ({
      ...prev,
      supportingOfficers: updatedSupporting,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white text-gray-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">ड्यूटी कार्ड विवरण सुधारें (Edit Duty Card)</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-semibold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duty Type */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ड्यूटी का प्रकार</label>
              <input
                type="text"
                name="dutyType"
                value={safeInputValue(editedRecord.dutyType)}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Duty Place */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ड्यूटी का स्थान</label>
              <input
                type="text"
                name="dutyPlace"
                value={safeInputValue(editedRecord.dutyPlace)}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Main Officer Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">मुख्य अधिकारी का नाम</label>
              <input
                type="text"
                name="mainOfficerName"
                value={safeInputValue(editedRecord.mainOfficerName)}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Main Officer Mobile */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">मुख्य अधिकारी मो0नं0</label>
              <input
                type="text"
                name="mainOfficerMobile"
                value={safeInputValue(editedRecord.mainOfficerMobile)}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Thana Area */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">थाना क्षेत्र</label>
              <input
                type="text"
                name="thanaArea"
                value={safeInputValue(editedRecord.thanaArea)}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Duty Time */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ड्यूटी का समय</label>
              <input
                type="text"
                name="dutyTime"
                value={safeInputValue(editedRecord.dutyTime)}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-bold text-gray-800 mb-2">अधिकारी / मजिस्ट्रेट (दायें कॉलम के अधिकारी)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Zonal Magistrate */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">जोनल मजिस्ट्रेट नाम व मो0नं0</label>
                <input
                  type="text"
                  name="zonalMagistrate"
                  value={editedRecord.zonalMagistrate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. श्री अमित कुमार (मो: 9999999999)"
                />
              </div>

              {/* Zonal Police Officer */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">जोनल पुलिस अधिकारी नाम व मो0नं0</label>
                <input
                  type="text"
                  name="zonalPoliceOfficer"
                  value={editedRecord.zonalPoliceOfficer}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. श्री राजेश सिंह (मो: 8888888888)"
                />
              </div>

              {/* Sector Magistrate */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">सेक्टर मजिस्ट्रेट नाम व मो0नं0</label>
                <input
                  type="text"
                  name="sectorMagistrate"
                  value={editedRecord.sectorMagistrate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. श्री दिनेश यादव (मो: 7777777777)"
                />
              </div>

              {/* Sector Police Officer */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">सेक्टर पुलिस अधिकारी का नाम/मो0नं0</label>
                <input
                  type="text"
                  name="sectorPoliceOfficer"
                  value={editedRecord.sectorPoliceOfficer}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. श्री विकास वर्मा (मो: 6666666666)"
                />
              </div>
            </div>
          </div>

          {/* Supporting Officers Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-gray-800">सहयोगी पुलिसकर्मी (Supporting Officers)</h4>
              <button
                type="button"
                onClick={addSupportingOfficer}
                className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                + सहयोगी जोड़ें
              </button>
            </div>

            {editedRecord.supportingOfficers.length === 0 ? (
              <p className="text-xs text-gray-500 italic">कोई सहयोगी पुलिसकर्मी नहीं जोड़ा गया है।</p>
            ) : (
              <div className="space-y-3">
                {editedRecord.supportingOfficers.map((officer, index) => (
                  <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                    <div className="flex-1">
                              <input
                          type="text"
                          value={safeInputValue(officer.name)}
                          onChange={(e) => handleSupportingChange(index, 'name', e.target.value)}
                          placeholder="सहयोगी का पदनाम व नाम (e.g. हे0का0 1395 सुमित कुमार)"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs"
                          required
                        />
                    </div>
                    <div className="w-[180px]">
                      <input
                        type="text"
                        value={safeInputValue(officer.mobile)}
                        onChange={(e) => handleSupportingChange(index, 'mobile', e.target.value)}
                        placeholder="मो0नं0"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs text-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSupportingOfficer(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center text-lg transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              सुरक्षित करें (Save)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
