# Navy Color Update Guide (#263252)

## Overview
Updating primary action buttons from Red to Navy (#263252) as per client requirements.

## Color Mapping

### Replace These Classes:
- `bg-red-600` → `bg-[#263252]`
- `hover:bg-red-700` → `hover:bg-[#1a2339]`
- `border-red-600` → `border-[#263252]`
- `ring-red-600` → `ring-[#263252]`
- `text-red-600` → `text-[#263252]`
- `from-red-600` → `from-[#263252]`
- `to-red-700` → `to-[#1a2339]`

### Inactive State:
- Transparent background with Navy border
- `bg-transparent border-2 border-[#263252] text-[#263252]`

### Active/Selected State:
- Filled Navy background with white text
- `bg-[#263252] text-white`

## Files Updated:
1. `/app/product-selection/page.tsx` - Product selection cards
2. `/app/profiles/dashboard/page.tsx` - Dashboard buttons
3. `/app/nfc/checkout/page.tsx` - Checkout buttons
4. Additional buttons across the application

## Preserve:
- Yellow/Amber colors (Founding Member badge) - Keep as is
- Error/warning messages with red - Keep as is
- Success messages with green - Keep as is
