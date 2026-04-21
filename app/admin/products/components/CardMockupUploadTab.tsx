'use client';

import { useState, useEffect, useRef } from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

type MockupSide = 'front' | 'back_with_logo' | 'back_without_logo';

interface MockupRecord {
  id: string;
  base_material: string;
  colour: string;
  pattern: string;
  side: MockupSide;
  image_url: string;
  created_at: string;
}

interface GroupedMockup {
  front?: { id: string; image_url: string };
  back_with_logo?: { id: string; image_url: string };
  back_without_logo?: { id: string; image_url: string };
}

const MATERIALS = [
  { value: 'pvc', label: 'PVC' },
  { value: 'wood', label: 'Wood' },
  { value: 'metal', label: 'Metal' },
];

const COLOURS = [
  { value: 'white', label: 'White', hex: '#FFFFFF' },
  { value: 'black', label: 'Black', hex: '#1A1A1A' },
  { value: 'cherry', label: 'Cherry', hex: '#8E3A2D' },
  { value: 'birch', label: 'Birch', hex: '#E5C79F' },
  { value: 'silver', label: 'Silver', hex: '#C0C0C0' },
  { value: 'rose-gold', label: 'Rose Gold', hex: '#B76E79' },
];

const PATTERNS = [
  { value: 'blank', label: 'Blank' },
  { value: 'geometric', label: 'Geometric' },
  { value: 'waves', label: 'Waves' },
  { value: 'crystal', label: 'Crystal' },
];

const SIDE_LABELS: Record<MockupSide, string> = {
  front: 'Front',
  back_with_logo: 'Back (with Linkist logo)',
  back_without_logo: 'Back (without logo)',
};

export default function CardMockupUploadTab() {
  const [mockups, setMockups] = useState<MockupRecord[]>([]);
  const [grouped, setGrouped] = useState<Record<string, GroupedMockup>>({});
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedMaterial, setSelectedMaterial] = useState<string>('pvc');
  const [selectedColour, setSelectedColour] = useState<string>('white');
  const [selectedPattern, setSelectedPattern] = useState<string>('blank');

  // Upload state
  const [uploading, setUploading] = useState<MockupSide | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRefs = {
    front: useRef<HTMLInputElement>(null),
    back_with_logo: useRef<HTMLInputElement>(null),
    back_without_logo: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    fetchMockups();
  }, []);

  const fetchMockups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/card-mockups');
      if (response.ok) {
        const data = await response.json();
        setMockups(data.mockups || []);
        setGrouped(data.grouped || {});
      }
    } catch (error) {
      console.error('Error fetching mockups:', error);
    }
    setLoading(false);
  };

  const comboKey = `${selectedMaterial}|${selectedColour}|${selectedPattern}`;
  const currentMockups = grouped[comboKey] || {};

  const handleUpload = async (side: MockupSide, file: File) => {
    setUploading(side);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('material', selectedMaterial);
      formData.append('colour', selectedColour);
      formData.append('pattern', selectedPattern);
      formData.append('side', side);

      const response = await fetch('/api/admin/card-mockups', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }

      await fetchMockups();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(message);
    }
    setUploading(null);
  };

  const handleDelete = async (side: MockupSide) => {
    const mockup = currentMockups[side];
    if (!mockup) return;

    if (!confirm(`Delete the ${SIDE_LABELS[side]} mockup for this combination?`)) return;

    try {
      const response = await fetch(`/api/admin/card-mockups?id=${mockup.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Delete failed');
      }

      await fetchMockups();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Delete failed';
      setUploadError(message);
    }
  };

  const onFileSelected = (side: MockupSide, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(side, file);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  // Count how many combos have all 3 sides uploaded
  const totalCombos = Object.keys(grouped).length;
  const completeCombos = Object.values(grouped).filter(
    (g) => g.front && g.back_with_logo && g.back_without_logo
  ).length;

  const sides: MockupSide[] = ['front', 'back_with_logo', 'back_without_logo'];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Card Mockup Images</h3>
            <p className="text-sm text-gray-500 mt-1">
              Upload card mockup PNGs (753 x 458) for each material + colour + pattern combination.
              These replace the CSS-generated previews on the card customization page.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{completeCombos}/{totalCombos}</div>
            <div className="text-xs text-gray-500">Complete sets</div>
          </div>
        </div>
      </div>

      {/* Combo Selector */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <h4 className="text-sm font-semibold text-gray-700">Select Card Combination</h4>
        </div>
        <div className="p-6 space-y-4">
          {/* Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base Material</label>
            <div className="flex gap-2">
              {MATERIALS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setSelectedMaterial(m.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedMaterial === m.value
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colour */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Colour</label>
            <div className="flex gap-3">
              {COLOURS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setSelectedColour(c.value)}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-10 h-10 rounded-lg transition-all ${
                      selectedColour === c.value ? 'scale-110 ring-2 ring-red-500 ring-offset-2' : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: c.hex,
                      border: c.value === 'white' ? '2px solid #d1d5db' : '2px solid transparent',
                    }}
                  />
                  <span className={`text-xs font-medium ${
                    selectedColour === c.value ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Pattern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pattern</label>
            <div className="flex gap-2">
              {PATTERNS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setSelectedPattern(p.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPattern === p.value
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Current Combo Status */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">
            Mockups for: <span className="text-red-600">{selectedMaterial} / {selectedColour} / {selectedPattern}</span>
          </h4>
          {currentMockups.front && currentMockups.back_with_logo && currentMockups.back_without_logo ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
              <CheckCircleIcon className="w-3 h-3" /> Complete
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
              <WarningIcon className="w-3 h-3" /> Incomplete
            </span>
          )}
        </div>

        {uploadError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        )}

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {sides.map((side) => {
            const mockup = currentMockups[side];
            const isUploading = uploading === side;

            return (
              <div key={side} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {SIDE_LABELS[side]}
                </label>

                {mockup ? (
                  <div className="relative group">
                    <div className="aspect-[753/458] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      <img
                        src={mockup.image_url}
                        alt={`${SIDE_LABELS[side]} mockup`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
                      <button
                        onClick={() => fileInputRefs[side].current?.click()}
                        className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                      >
                        Replace
                      </button>
                      <button
                        onClick={() => handleDelete(side)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        <DeleteIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRefs[side].current?.click()}
                    disabled={isUploading}
                    className="aspect-[753/458] w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
                        <span className="text-sm text-gray-500">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <CloudUploadIcon className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-500">Click to upload</span>
                        <span className="text-xs text-gray-400">753 x 458 PNG</span>
                      </>
                    )}
                  </button>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRefs[side]}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFileSelected(side, e)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* All Uploaded Combos Overview */}
      {totalCombos > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
            <h4 className="text-sm font-semibold text-gray-700">All Uploaded Combinations ({totalCombos})</h4>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(grouped).map(([key, g]) => {
                const [mat, col, pat] = key.split('|');
                const isComplete = !!(g.front && g.back_with_logo && g.back_without_logo);
                const isSelected = key === comboKey;
                const uploadCount = [g.front, g.back_with_logo, g.back_without_logo].filter(Boolean).length;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedMaterial(mat);
                      setSelectedColour(col);
                      setSelectedPattern(pat);
                    }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-50 ring-1 ring-red-500'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {g.front ? (
                        <div className="w-8 h-5 rounded overflow-hidden border border-gray-200">
                          <img src={g.front.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <ImageIcon className="w-5 h-5 text-gray-300" />
                      )}
                      {isComplete ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">{uploadCount}/3</span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-gray-900 capitalize">{mat}</div>
                    <div className="text-xs text-gray-500 capitalize">{col} / {pat}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
