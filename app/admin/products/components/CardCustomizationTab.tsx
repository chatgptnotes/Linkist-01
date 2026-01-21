'use client';

import { useState, useEffect } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
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
  plan_enabled?: boolean; // For plan-specific view
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
  type: 'physical-digital' | 'digital-with-app' | 'digital-only' | 'founders-club';
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    materials: true,
    textures: true,
    colours: true,
    patterns: true
  });
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [updating, setUpdating] = useState<string | null>(null);

  // Plan-specific state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchOptions();
  }, []);

  // Refetch options when selected plan changes
  useEffect(() => {
    if (plans.length > 0) {
      fetchOptions();
    }
  }, [selectedPlanId]);

  const fetchOptions = async () => {
    setLoading(true);
    try {
      // Build URL with optional plan_id parameter
      const url = selectedPlanId
        ? `/api/admin/card-customization?plan_id=${selectedPlanId}`
        : '/api/admin/card-customization';

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setOptions(data.options || []);
        setGrouped(data.grouped || { materials: [], textures: [], colours: [], patterns: [] });

        // Set plans from initial load (when no plan is selected)
        if (data.plans && data.plans.length > 0 && plans.length === 0) {
          setPlans(data.plans);
          // Auto-select first plan (physical-digital)
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

  const handleToggleEnabled = async (option: CardCustomizationOption) => {
    setUpdating(option.id);
    try {
      // Use plan-specific toggle when a plan is selected
      const body = selectedPlanId
        ? { id: option.id, action: 'togglePlan', plan_id: selectedPlanId }
        : { id: option.id, action: 'toggle' };

      const response = await fetch('/api/admin/card-customization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        // Refresh the data
        await fetchOptions();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update option');
      }
    } catch (error) {
      console.error('Error toggling option:', error);
      alert('Failed to update option');
    }
    setUpdating(null);
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

  // Helper: Get the enabled status for an option (plan-specific or global)
  const isOptionEnabled = (option: CardCustomizationOption): boolean => {
    // When a plan is selected, use plan_enabled
    if (selectedPlanId && option.plan_enabled !== undefined) {
      return option.plan_enabled;
    }
    // Default to global is_enabled
    return option.is_enabled;
  };

  // Get selected plan name for display
  const getSelectedPlanName = (): string => {
    if (!selectedPlanId) return '';
    const plan = plans.find(p => p.id === selectedPlanId);
    return plan?.name || '';
  };

  const renderMaterialsTable = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Enabled</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {grouped.materials.map((option) => {
          const enabled = isOptionEnabled(option);
          return (
            <tr key={option.id} className={`hover:bg-gray-50 ${!enabled ? 'opacity-50' : ''}`}>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mr-3">
                    <span className="text-xs font-bold text-gray-600">{option.label.charAt(0)}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{option.label}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-500">{option.description || '-'}</span>
              </td>
              <td className="px-6 py-4">
                {editingPrice === option.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(parseFloat(e.target.value) || 0)}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSavePrice(option)}
                      disabled={updating === option.id}
                      className="p-1 text-green-600 hover:text-green-800"
                    >
                      <SaveIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEditPrice}
                      className="p-1 text-gray-600 hover:text-gray-800"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">${option.price?.toFixed(2) || '0.00'}</span>
                    <button
                      onClick={() => handleStartEditPrice(option)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <button
                  onClick={() => handleToggleEnabled(option)}
                  disabled={updating === option.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabled ? 'bg-green-500' : 'bg-gray-300'
                  } ${updating === option.id ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderTexturesTable = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Texture</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applies To</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Enabled</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {grouped.textures.map((option) => {
          const enabled = isOptionEnabled(option);
          return (
            <tr key={option.id} className={`hover:bg-gray-50 ${!enabled ? 'opacity-50' : ''}`}>
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-gray-900">{option.label}</span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-500">{option.description || '-'}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {option.applicable_materials?.map((mat) => (
                    <span
                      key={mat}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {mat.toUpperCase()}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <button
                  onClick={() => handleToggleEnabled(option)}
                  disabled={updating === option.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabled ? 'bg-green-500' : 'bg-gray-300'
                  } ${updating === option.id ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderColoursTable = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Colour</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applies To</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Founders Only</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Enabled</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {grouped.colours.map((option) => {
          const enabled = isOptionEnabled(option);
          return (
            <tr key={option.id} className={`hover:bg-gray-50 ${!enabled ? 'opacity-50' : ''}`}>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div
                    className="h-8 w-8 rounded-lg mr-3 border border-gray-200"
                    style={{ backgroundColor: option.hex_color || '#ccc' }}
                  />
                  <span className="text-sm font-medium text-gray-900">{option.label}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {option.applicable_materials?.map((mat) => (
                    <span
                      key={mat}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {mat.toUpperCase()}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                {option.is_founders_only ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                    <StarIcon className="h-3 w-3 mr-1" />
                    Founders
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <button
                  onClick={() => handleToggleEnabled(option)}
                  disabled={updating === option.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabled ? 'bg-green-500' : 'bg-gray-300'
                  } ${updating === option.id ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderPatternsTable = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pattern</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Enabled</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {grouped.patterns.map((option) => {
          const enabled = isOptionEnabled(option);
          return (
            <tr key={option.id} className={`hover:bg-gray-50 ${!enabled ? 'opacity-50' : ''}`}>
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-gray-900">{option.label}</span>
              </td>
              <td className="px-6 py-4 text-center">
                <button
                  onClick={() => handleToggleEnabled(option)}
                  disabled={updating === option.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabled ? 'bg-green-500' : 'bg-gray-300'
                  } ${updating === option.id ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderSection = (title: string, key: string, renderTable: () => React.ReactNode, itemCount: number) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <button
        onClick={() => toggleSection(key)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {itemCount} items
          </span>
        </div>
        {expandedSections[key] ? (
          <ExpandLessIcon className="h-5 w-5 text-gray-400" />
        ) : (
          <ExpandMoreIcon className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {expandedSections[key] && (
        <div className="border-t border-gray-200">
          {itemCount > 0 ? renderTable() : (
            <div className="px-6 py-8 text-center text-gray-500">
              No {title.toLowerCase()} found
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-500">Loading customization options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Plan Selector */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-gray-500">
            Configure which card customization options are available for each subscription plan.
          </p>

          {/* Plan Selector Dropdown */}
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
                    {plan.type === 'physical-digital' ? 'Personal Plan' : 'Founders Club'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Plan Info Banner */}
        {selectedPlanId && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Configuring: {getSelectedPlanName()}</span>
              {' '}&mdash;{' '}
              Toggle options on/off to control what subscribers to this plan can select when customizing their card.
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{grouped.materials.filter(m => isOptionEnabled(m)).length}/{grouped.materials.length}</div>
          <div className="text-sm text-gray-500">Materials Enabled</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{grouped.textures.filter(t => isOptionEnabled(t)).length}/{grouped.textures.length}</div>
          <div className="text-sm text-gray-500">Textures Enabled</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{grouped.colours.filter(c => isOptionEnabled(c)).length}/{grouped.colours.length}</div>
          <div className="text-sm text-gray-500">Colours Enabled</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{grouped.patterns.filter(p => isOptionEnabled(p)).length}/{grouped.patterns.length}</div>
          <div className="text-sm text-gray-500">Patterns Enabled</div>
        </div>
      </div>

      {/* Sections */}
      {renderSection('Materials', 'materials', renderMaterialsTable, grouped.materials.length)}
      {renderSection('Textures', 'textures', renderTexturesTable, grouped.textures.length)}
      {renderSection('Colours', 'colours', renderColoursTable, grouped.colours.length)}
      {renderSection('Patterns', 'patterns', renderPatternsTable, grouped.patterns.length)}
    </div>
  );
}
