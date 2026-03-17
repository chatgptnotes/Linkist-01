'use client';

import { useState, useEffect } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';

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
  is_default?: boolean;
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

  // Hierarchy selection state
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);
  const [selectedColour, setSelectedColour] = useState<string | null>(null);

  // Pending toggle changes (local state, not yet saved)
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

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
    setSelectedTexture(null);
    setSelectedColour(null);
    if (plans.length > 0) {
      fetchOptions();
    }
  }, [selectedPlanId]);

  // Refetch when material changes — reset texture/colour selections
  useEffect(() => {
    setSelectedTexture(null);
    setSelectedColour(null);
    if (plans.length > 0) {
      fetchOptions();
    }
  }, [selectedMaterial]);

  // Refetch when texture changes — reset colour selection
  useEffect(() => {
    setSelectedColour(null);
    if (plans.length > 0 && selectedTexture) {
      fetchOptions();
    }
  }, [selectedTexture]);

  // Refetch when colour changes
  useEffect(() => {
    if (plans.length > 0 && selectedColour) {
      fetchOptions();
    }
  }, [selectedColour]);

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
      if (selectedTexture) params.append('texture', selectedTexture);
      if (selectedColour) params.append('colour', selectedColour);
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
  // Key format encodes the full hierarchy path
  const getToggleKey = (option: CardCustomizationOption): string => {
    if (!selectedPlanId) return option.id;

    if (option.category === 'texture' && selectedMaterial) {
      return `${option.id}__${selectedMaterial}`;
    }
    if (option.category === 'colour' && selectedMaterial && selectedTexture) {
      return `${option.id}__${selectedMaterial}__${selectedTexture}`;
    }
    if (option.category === 'pattern' && selectedMaterial && selectedTexture && selectedColour) {
      return `${option.id}__${selectedMaterial}__${selectedTexture}__${selectedColour}`;
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
          texture_key: parts[2] || null,
          colour_key: parts[3] || null,
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
      case 'pro': return 'Business Plan';
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

  const getSelectedMaterialOption = () => {
    return grouped.materials.find(m => m.option_key === selectedMaterial);
  };

  const hasUnsavedChanges = Object.keys(pendingToggles).length > 0;

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

  // Handle setting/clearing default for an option
  const handleSetDefault = async (option: CardCustomizationOption) => {
    if (!selectedPlanId) return;

    const isCurrentlyDefault = option.is_default;

    setSettingDefault(option.id);
    try {
      const response = await fetch('/api/admin/card-customization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: option.id,
          action: 'setDefault',
          plan_id: selectedPlanId,
          material_key: selectedMaterial || null,
          texture_key: option.category === 'colour' ? selectedTexture || null : null,
          colour_key: option.category === 'pattern' ? selectedColour || null : null,
          category: option.category,
          is_default: !isCurrentlyDefault,
        }),
      });

      if (response.ok) {
        await fetchOptions();
      }
    } catch (error) {
      console.error('Error setting default:', error);
    } finally {
      setSettingDefault(null);
    }
  };

  // Render default pin button
  const renderDefaultPin = (option: CardCustomizationOption) => {
    const enabled = isOptionEnabled(option);
    if (!enabled) return <span className="text-gray-300">-</span>;

    const isDefault = option.is_default;
    const isSettingThis = settingDefault === option.id;

    return (
      <button
        onClick={() => handleSetDefault(option)}
        disabled={isSettingThis}
        title={isDefault ? 'Remove as default' : 'Set as default'}
        className={`p-1 rounded-md transition-all ${
          isDefault
            ? 'text-red-600 bg-red-50 hover:bg-red-100'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        } ${isSettingThis ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
      >
        {isDefault ? (
          <PushPinIcon className="h-4 w-4" />
        ) : (
          <PushPinOutlinedIcon className="h-4 w-4" />
        )}
      </button>
    );
  };

  // Render a "Configure →" / "✓ Selected" button for drill-down
  const renderConfigureButton = (
    enabled: boolean,
    isSelected: boolean,
    onToggle: () => void,
    activeColor: string = 'bg-red-600'
  ) => {
    if (!enabled) return <span className="text-xs text-gray-400">-</span>;
    return (
      <button
        onClick={onToggle}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
          isSelected
            ? `${activeColor} text-white shadow-sm`
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {isSelected ? '✓ Selected' : 'Configure →'}
      </button>
    );
  };

  if (loading && options.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-500">Loading customization options...</span>
      </div>
    );
  }

  const selectedMaterialOption = getSelectedMaterialOption();
  const allTextures = grouped.textures;
  const allColours = grouped.colours;
  const allPatterns = grouped.patterns;

  // Pre-compute enabled counts and selected labels (avoid repeated .find/.filter in render)
  const enabledTextures = allTextures.filter(t => isOptionEnabled(t));
  const enabledColours = allColours.filter(c => isOptionEnabled(c));
  const enabledPatterns = allPatterns.filter(p => isOptionEnabled(p));

  const selectedTextureLabel = selectedTexture ? allTextures.find(t => t.option_key === selectedTexture)?.label : null;
  const selectedColourLabel = selectedColour ? allColours.find(c => c.option_key === selectedColour)?.label : null;

  // Breadcrumb path
  const breadcrumb = [
    selectedMaterialOption?.label,
    selectedTextureLabel,
    selectedColourLabel,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header with Plan Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-gray-500">
          Configure card customization hierarchy: Material → Texture → Colour → Pattern
        </p>

        {plans.length > 0 && (
          <div className="flex items-center gap-3">
            <label htmlFor="plan-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Configure for:
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

      {/* Hierarchy Breadcrumb */}
      {selectedMaterial && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Path:</span>
          <span className="font-medium text-gray-700">{getSelectedPlanName()}</span>
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="text-gray-400">→</span>
              <span className={`font-medium ${i === breadcrumb.length - 1 ? 'text-red-600' : 'text-gray-700'}`}>
                {item}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Plan Info Banner */}
      {selectedPlanId && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Configuring: {getSelectedPlanName()}</span>
            {' '}&mdash;{' '}
            Select Material → toggle Textures → select a Texture to configure its Colours → select a Colour to configure its Patterns.
          </p>
        </div>
      )}

      {/* Material Selection Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <h3 className="text-lg font-semibold text-gray-900">① Select Base Material</h3>
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
              ② Textures for {selectedMaterialOption.label}
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              Toggle which textures are available, then select one to configure its colours.
            </p>
          </div>

          {/* Textures Section — toggles + selectable */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('textures')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900">Textures</h3>
                <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {enabledTextures.length}/{allTextures.length} enabled
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
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Default</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Enabled</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Colours</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allTextures.map((texture) => {
                        const enabled = isOptionEnabled(texture);
                        const isSelectedTexture = selectedTexture === texture.option_key;
                        return (
                          <tr
                            key={texture.id}
                            className={`hover:bg-gray-50 ${!enabled ? 'opacity-50' : ''} ${isSelectedTexture ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-gray-900">{texture.label}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-500">{texture.description || '-'}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {renderDefaultPin(texture)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {renderToggle(texture)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {renderConfigureButton(
                                enabled, isSelectedTexture,
                                () => setSelectedTexture(isSelectedTexture ? null : texture.option_key),
                                'bg-red-600'
                              )}
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

          {/* Colours Section — only shown when a texture is selected */}
          {selectedTexture && (
            <>
              <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white rounded-lg px-6 py-4">
                <h3 className="text-lg font-semibold">
                  ③ Colours for {selectedMaterialOption.label} → {selectedTextureLabel}
                </h3>
                <p className="text-sm text-blue-200 mt-1">
                  Toggle which colours are available for this texture, then select one to configure its patterns.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-blue-200">
                <button
                  onClick={() => toggleSection('colours')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">Colours</h3>
                    <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                      {enabledColours.length}/{allColours.length} enabled
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
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Default</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Enabled</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Patterns</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {allColours.map((colour) => {
                            const enabled = isOptionEnabled(colour);
                            const isSelectedColour = selectedColour === colour.option_key;
                            return (
                              <tr
                                key={colour.id}
                                className={`hover:bg-gray-50 ${!enabled ? 'opacity-50' : ''} ${isSelectedColour ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                              >
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
                                  {renderDefaultPin(colour)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {renderToggle(colour)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {renderConfigureButton(
                                    enabled, isSelectedColour,
                                    () => setSelectedColour(isSelectedColour ? null : colour.option_key),
                                    'bg-blue-600'
                                  )}
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
            </>
          )}

          {/* Patterns Section — only shown when a colour is selected */}
          {selectedTexture && selectedColour && (
            <>
              <div className="bg-gradient-to-r from-purple-800 to-purple-900 text-white rounded-lg px-6 py-4">
                <h3 className="text-lg font-semibold">
                  ④ Patterns for {selectedMaterialOption.label} → {selectedTextureLabel} → {selectedColourLabel}
                </h3>
                <p className="text-sm text-purple-200 mt-1">
                  Toggle which patterns are available for this colour combination.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-purple-200">
                <button
                  onClick={() => toggleSection('patterns')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">Patterns</h3>
                    <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                      {enabledPatterns.length}/{allPatterns.length} enabled
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
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Default</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Enabled</th>
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
                                  {renderDefaultPin(pattern)}
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
            </>
          )}
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
            {enabledTextures.length}/{allTextures.length}
          </div>
          <div className="text-sm text-gray-500">Textures Enabled</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {enabledColours.length}/{allColours.length}
          </div>
          <div className="text-sm text-gray-500">Colours Enabled</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {enabledPatterns.length}/{allPatterns.length}
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
