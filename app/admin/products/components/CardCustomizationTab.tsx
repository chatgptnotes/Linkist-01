'use client';

import { useState, useEffect } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';

interface CardCustomizationOption {
  id: string;
  category: 'material' | 'texture' | 'colour' | 'pattern';
  option_key: string;
  label: string;
  description: string | null;
  hex_color: string | null;
  gradient_class: string | null;
  price: number | null;
  applicable_materials: string[] | null;
  is_enabled: boolean;
  is_founders_only: boolean;
  display_order: number;
  plan_enabled?: boolean;
}

interface GroupedOptions {
  materials: CardCustomizationOption[];
  textures: CardCustomizationOption[];
  colours: CardCustomizationOption[];
  patterns: CardCustomizationOption[];
}

interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'physical-digital' | 'digital-with-app' | 'digital-only' | 'founders-club' | 'signature' | 'pro' | 'founders-circle' | 'starter' | 'next';
  price: number;
  description: string;
  status: string;
}

export default function CardCustomizationTab() {
  const [options, setOptions] = useState<CardCustomizationOption[]>([]);
  const [grouped, setGrouped] = useState<GroupedOptions>({
    materials: [],
    textures: [],
    colours: [],
    patterns: []
  });
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [updating, setUpdating] = useState<string | null>(null);

  // Plan-specific state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Material selection state
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  // Pending toggle changes (local state, not yet saved)
  // Key format: "optionId" for materials, "optionId__materialKey" for textures/colours/patterns
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    textures: true,
    colours: true,
    patterns: true
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  // Clear pending toggles and refetch when plan changes
  useEffect(() => {
    setPendingToggles({});
    if (plans.length > 0) {
      fetchOptions();
    }
  }, [selectedPlanId]);

  // Refetch options when material changes (keep pending toggles for other materials)
  useEffect(() => {
    if (plans.length > 0) {
      fetchOptions();
    }
  }, [selectedMaterial]);

  // Auto-select first enabled material when data loads
  useEffect(() => {
    if (grouped.materials.length > 0 && !selectedMaterial) {
      const firstEnabled = grouped.materials.find(m => isOptionEnabled(m));
      setSelectedMaterial(firstEnabled?.option_key || grouped.materials[0].option_key);
    }
  }, [grouped.materials]);

  const fetchOptions = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/card-customization';
      const params = new URLSearchParams();
      if (selectedPlanId) params.append('plan_id', selectedPlanId);
      if (selectedMaterial) params.append('material', selectedMaterial);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setOptions(data.options || []);
        setGrouped(data.grouped || { materials: [], textures: [], colours: [], patterns: [] });

        if (data.plans && data.plans.length > 0 && plans.length === 0) {
          setPlans(data.plans);
          setSelectedPlanId(data.plans[0].id);
        }
      } else {
        console.error('Failed to fetch card customization options');
      }
    } catch (error) {
      console.error('Error fetching card customization options:', error);
    }
    setLoading(false);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get toggle key for an option (used to track pending changes)
  const getToggleKey = (option: CardCustomizationOption): string => {
    if (selectedPlanId && (option.category === 'colour' || option.category === 'texture' || option.category === 'pattern') && selectedMaterial) {
      return `${option.id}__${selectedMaterial}`;
    }
    return option.id;
  };

  // Get the server (original) enabled state for an option
  const getServerEnabled = (option: CardCustomizationOption): boolean => {
    if (selectedPlanId && option.plan_enabled !== undefined) {
      return option.plan_enabled;
    }
    return option.is_enabled;
  };

  const handleToggleEnabled = (option: CardCustomizationOption) => {
    const key = getToggleKey(option);
    const currentDisplayed = isOptionEnabled(option);
    const newValue = !currentDisplayed;
    const serverValue = getServerEnabled(option);

    setPendingToggles(prev => {
      const next = { ...prev };
      if (newValue === serverValue) {
        // Back to original state, remove from pending
        delete next[key];
      } else {
        next[key] = newValue;
      }
      return next;
    });
  };

  const handleSaveAll = async () => {
    const keys = Object.keys(pendingToggles);
    if (keys.length === 0) return;

    setSaving(true);
    try {
      const toggles = keys.map(key => {
        const parts = key.split('__');
        return {
          option_id: parts[0],
          material_key: parts[1] || null,
          is_enabled: pendingToggles[key]
        };
      });

      const response = await fetch('/api/admin/card-customization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batchToggle',
          plan_id: selectedPlanId,
          toggles
        })
      });

      if (response.ok) {
        setPendingToggles({});
        await fetchOptions();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes');
    }
    setSaving(false);
  };

  const handleDiscardChanges = () => {
    setPendingToggles({});
  };

  const handleStartEditPrice = (option: CardCustomizationOption) => {
    setEditingPrice(option.id);
    setTempPrice(option.price || 0);
  };

  const handleSavePrice = async (option: CardCustomizationOption) => {
    setUpdating(option.id);
    try {
      const response = await fetch('/api/admin/card-customization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: option.id, action: 'updatePrice', price: tempPrice })
      });

      if (response.ok) {
        setEditingPrice(null);
        await fetchOptions();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update price');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Failed to update price');
    }
    setUpdating(null);
  };

  const handleCancelEditPrice = () => {
    setEditingPrice(null);
    setTempPrice(0);
  };

  const isOptionEnabled = (option: CardCustomizationOption): boolean => {
    const key = getToggleKey(option);
    if (key in pendingToggles) {
      return pendingToggles[key];
    }
    if (selectedPlanId && option.plan_enabled !== undefined) {
      return option.plan_enabled;
    }
    return option.is_enabled;
  };

  const getPlanDisplayName = (plan: SubscriptionPlan): string => {
    switch (plan.type) {
      case 'physical-digital': return 'Personal Plan';
      case 'signature': return 'Signature Plan';
      case 'pro': return 'Pro Plan';
      case 'founders-club': return 'Founders Club';
      case 'founders-circle': return 'Founders Circle';
      case 'starter': return 'Starter Plan';
      case 'next': return 'Next Plan';
      default: return plan.name;
    }
  };

  const getSelectedPlanName = (): string => {
    if (!selectedPlanId) return '';
    const plan = plans.find(p => p.id === selectedPlanId);
    if (!plan) return '';
    return getPlanDisplayName(plan);
  };

  // Get ALL textures - admin can enable any texture for any material
  const getAllTextures = () => {
    return grouped.textures;
  };

  // Get ALL colours - admin can enable any colour for any material
  const getAllColours = () => {
    return grouped.colours;
  };

  // Get ALL patterns - admin can enable any pattern for any material
  const getAllPatterns = () => {
    return grouped.patterns;
  };

  // Get selected material object
  const getSelectedMaterialOption = () => {
    return grouped.materials.find(m => m.option_key === selectedMaterial);
  };

  const hasUnsavedChanges = Object.keys(pendingToggles).length > 0;

  // Check if a specific option has a pending (unsaved) change
  const hasPendingChange = (option: CardCustomizationOption): boolean => {
    const key = getToggleKey(option);
    return key in pendingToggles;
  };

  // Render toggle button
  const renderToggle = (option: CardCustomizationOption) => {
    const enabled = isOptionEnabled(option);
    const isPending = hasPendingChange(option);
    return (
      <button
        onClick={() => handleToggleEnabled(option)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border-2 ${
          enabled ? 'bg-green-500 border-green-600' : 'bg-gray-200 border-gray-300'
        } ${isPending ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full transition-transform shadow-md border ${
            enabled ? 'translate-x-6 bg-green-600 border-green-700' : 'translate-x-1 bg-gray-500 border-gray-600'
          }`}
        />
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-500">Loading customization options...</span>
      </div>
    );
  }

  const selectedMaterialOption = getSelectedMaterialOption();
  const allTextures = getAllTextures();
  const allColours = getAllColours();
  const allPatterns = getAllPatterns();

  return (
    <div className="space-y-6">
      {/* Header with Plan Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-gray-500">
          Configure which card customization options are available for each subscription plan.
        </p>

        {plans.length > 0 && (
          <div className="flex items-center gap-3">
            <label htmlFor="plan-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Configure options for:
            </label>
            <select
              id="plan-select"
              value={selectedPlanId || ''}
              onChange={(e) => setSelectedPlanId(e.target.value || null)}
              className="block w-48 px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500 bg-white"
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {getPlanDisplayName(plan)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Plan Info Banner */}
      {selectedPlanId && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Configuring: {getSelectedPlanName()}</span>
            {' '}&mdash;{' '}
            Select a material, then toggle which textures, colours, and patterns are available for that material.
          </p>
        </div>
      )}

      {/* Material Selection Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <h3 className="text-lg font-semibold text-gray-900">Select Base Material</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            {grouped.materials.map((material) => {
              const enabled = isOptionEnabled(material);
              const isSelected = selectedMaterial === material.option_key;

              return (
                <div key={material.id} className="flex flex-col items-center">
                  <button
                    onClick={() => setSelectedMaterial(material.option_key)}
                    className={`relative px-6 py-4 rounded-xl border-2 transition-all min-w-[140px] ${
                      isSelected
                        ? 'border-red-500 bg-red-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    } ${!enabled ? 'opacity-50' : ''}`}
                  >
                    <div className="text-center">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-2">
                        <span className="text-sm font-bold text-gray-600">{material.label.charAt(0)}</span>
                      </div>
                      <h4 className={`font-semibold ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>
                        {material.label}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{material.description}</p>
                      <div className="mt-2 text-sm font-bold text-gray-900">${material.price?.toFixed(2)}</div>
                    </div>
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* Material Enable Toggle */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    {renderToggle(material)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Options for Selected Material */}
      {selectedMaterial && selectedMaterialOption && (
        <div className="space-y-4">
          {/* Header showing selected material */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg px-6 py-4">
            <h3 className="text-lg font-semibold">
              Options for {selectedMaterialOption.label} Material
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              Configure which textures, colours, and patterns are available when users select {selectedMaterialOption.label}
            </p>
          </div>

          {/* Textures Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('textures')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900">Textures</h3>
                <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {allTextures.filter(t => isOptionEnabled(t)).length}/{allTextures.length} enabled
                </span>
              </div>
              {expandedSections.textures ? (
                <ExpandLessIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ExpandMoreIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSections.textures && (
              <div className="border-t border-gray-200">
                {allTextures.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Texture</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Enabled for {selectedMaterialOption.label}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allTextures.map((texture) => {
                        const enabled = isOptionEnabled(texture);
                        return (
                          <tr key={texture.id} className={`hover:bg-gray-50 ${!enabled ? 'opacity-50' : ''}`}>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-gray-900">{texture.label}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-500">{texture.description || '-'}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {renderToggle(texture)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No textures found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Colours Section - Shows ALL colours */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('colours')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900">Colours</h3>
                <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {allColours.filter(c => isOptionEnabled(c)).length}/{allColours.length} enabled
                </span>
              </div>
              {expandedSections.colours ? (
                <ExpandLessIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ExpandMoreIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSections.colours && (
              <div className="border-t border-gray-200">
                {allColours.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Colour</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Founders Only</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Enabled for {selectedMaterialOption?.label || 'Material'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allColours.map((colour) => {
                        const enabled = isOptionEnabled(colour);
                        return (
                          <tr key={colour.id} className={`hover:bg-gray-50 ${!enabled ? 'opacity-50' : ''}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div
                                  className="h-8 w-8 rounded-lg mr-3 border-2 border-gray-400 shadow-sm"
                                  style={{ backgroundColor: colour.hex_color || '#ccc' }}
                                />
                                <span className="text-sm font-medium text-gray-900">{colour.label}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {colour.is_founders_only ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                  <StarIcon className="h-3 w-3 mr-1" />
                                  Founders
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {renderToggle(colour)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No colours found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Patterns Section - Shows ALL patterns */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('patterns')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900">Patterns</h3>
                <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {allPatterns.filter(p => isOptionEnabled(p)).length}/{allPatterns.length} enabled
                </span>
              </div>
              {expandedSections.patterns ? (
                <ExpandLessIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ExpandMoreIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSections.patterns && (
              <div className="border-t border-gray-200">
                {allPatterns.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pattern</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Enabled for {selectedMaterialOption?.label || 'Material'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allPatterns.map((pattern) => {
                        const enabled = isOptionEnabled(pattern);
                        return (
                          <tr key={pattern.id} className={`hover:bg-gray-50 ${!enabled ? 'opacity-50' : ''}`}>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-gray-900">{pattern.label}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {renderToggle(pattern)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No patterns found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {grouped.materials.filter(m => isOptionEnabled(m)).length}/{grouped.materials.length}
          </div>
          <div className="text-sm text-gray-500">Materials Enabled</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {grouped.textures.filter(t => isOptionEnabled(t)).length}/{grouped.textures.length}
          </div>
          <div className="text-sm text-gray-500">Textures Enabled</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {grouped.colours.filter(c => isOptionEnabled(c)).length}/{grouped.colours.length}
          </div>
          <div className="text-sm text-gray-500">Colours Enabled</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {grouped.patterns.filter(p => isOptionEnabled(p)).length}/{grouped.patterns.length}
          </div>
          <div className="text-sm text-gray-500">Patterns Enabled</div>
        </div>
      </div>

      {/* Sticky Save Bar */}
      {hasUnsavedChanges && (
        <div className="sticky bottom-0 z-10 bg-white border-t-2 border-amber-400 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] rounded-lg px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm text-gray-700">
              <span className="font-semibold text-amber-600">{Object.keys(pendingToggles).length}</span> unsaved change{Object.keys(pendingToggles).length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDiscardChanges}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <SaveIcon className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
