export const CURRENCIES = {
  AUD: {
    symbol: '$',
    items: [
      { id: '100d', value: 100, type: 'note', color: 'bg-green-100 border-green-500 text-green-800', label: '$100', sizeClass: 'w-[128px] h-[52px] text-base' },
      { id: '50d', value: 50, type: 'note', color: 'bg-yellow-100 border-yellow-500 text-yellow-800', label: '$50', sizeClass: 'w-[122px] h-[52px] text-base' },
      { id: '20d', value: 20, type: 'note', color: 'bg-red-100 border-red-500 text-red-800', label: '$20', sizeClass: 'w-[116px] h-[52px] text-base' },
      { id: '10d', value: 10, type: 'note', color: 'bg-blue-100 border-blue-500 text-blue-800', label: '$10', sizeClass: 'w-[110px] h-[52px] text-base' },
      { id: '5d', value: 5, type: 'note', color: 'bg-fuchsia-100 border-fuchsia-500 text-fuchsia-800', label: '$5', sizeClass: 'w-[104px] h-[52px] text-base' },
      { id: '2d', value: 2, type: 'coin', color: 'bg-yellow-300 border-yellow-500 text-yellow-900', label: '$2', sizeClass: 'w-[42px] h-[42px] text-xs' },
      { id: '1d', value: 1, type: 'coin', color: 'bg-yellow-300 border-yellow-500 text-yellow-900', label: '$1', sizeClass: 'w-[51px] h-[51px] text-sm' },
      { id: '50c', value: 0.50, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '50c', isPoly: true, polyPoints: 'polygon(50% 0%, 75% 6.7%, 93.3% 25%, 100% 50%, 93.3% 75%, 75% 93.3%, 50% 100%, 25% 93.3%, 6.7% 75%, 0% 50%, 6.7% 25%, 25% 6.7%)', sizeClass: 'w-[64px] h-[64px] text-base' },
      { id: '20c', value: 0.20, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '20c', sizeClass: 'w-[58px] h-[58px] text-base' },
      { id: '10c', value: 0.10, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '10c', sizeClass: 'w-[48px] h-[48px] text-sm' },
      { id: '5c', value: 0.05, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '5c', sizeClass: 'w-[40px] h-[40px] text-xs' },
    ]
  },
  GBP: {
    symbol: '£',
    items: [
      { id: '50p', value: 50, type: 'note', color: 'bg-red-100 border-red-500 text-red-800', label: '£50', sizeClass: 'w-[140px] h-[60px] text-base' },
      { id: '20p', value: 20, type: 'note', color: 'bg-purple-100 border-purple-500 text-purple-800', label: '£20', sizeClass: 'w-[130px] h-[55px] text-base' },
      { id: '10p', value: 10, type: 'note', color: 'bg-orange-100 border-orange-500 text-orange-800', label: '£10', sizeClass: 'w-[124px] h-[52px] text-base' },
      { id: '5p', value: 5, type: 'note', color: 'bg-teal-100 border-teal-500 text-teal-800', label: '£5', sizeClass: 'w-[118px] h-[48px] text-base' },
      { id: '2c', value: 2, type: 'coin', color: 'bg-yellow-200 border-gray-400 text-gray-800', label: '£2', isBimetallic: true, innerColor: 'bg-gray-200', sizeClass: 'w-[58px] h-[58px] text-sm' },
      { id: '1c', value: 1, type: 'coin', color: 'bg-gray-200 border-yellow-500 text-gray-800', label: '£1', isPoly: true, polyPoints: 'polygon(50% 0%, 75% 6.7%, 93.3% 25%, 100% 50%, 93.3% 75%, 75% 93.3%, 50% 100%, 25% 93.3%, 6.7% 75%, 0% 50%, 6.7% 25%, 25% 6.7%)', isBimetallic: true, innerColor: 'bg-yellow-200', sizeClass: 'w-[48px] h-[48px] text-sm' },
      { id: '50cc', value: 0.50, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '50p', isPoly: true, polyPoints: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)', sizeClass: 'w-[56px] h-[56px] text-sm' },
      { id: '20cc', value: 0.20, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '20p', isPoly: true, polyPoints: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)', sizeClass: 'w-[44px] h-[44px] text-xs' },
      { id: '10cc', value: 0.10, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '10p', sizeClass: 'w-[50px] h-[50px] text-sm' },
      { id: '5cc', value: 0.05, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '5p', sizeClass: 'w-[38px] h-[38px] text-xs' },
    ]
  },
  CAD: {
    symbol: '$',
    items: [
      { id: '100d', value: 100, type: 'note', color: 'bg-amber-100 border-amber-600 text-amber-900', label: '$100', sizeClass: 'w-[110px] h-[46px] text-sm' },
      { id: '50d', value: 50, type: 'note', color: 'bg-red-100 border-red-600 text-red-900', label: '$50', sizeClass: 'w-[110px] h-[46px] text-sm' },
      { id: '20d', value: 20, type: 'note', color: 'bg-emerald-100 border-emerald-600 text-emerald-900', label: '$20', sizeClass: 'w-[110px] h-[46px] text-sm' },
      { id: '10d', value: 10, type: 'note', color: 'bg-purple-100 border-purple-600 text-purple-900', label: '$10', sizeClass: 'w-[110px] h-[46px] text-sm' },
      { id: '5d', value: 5, type: 'note', color: 'bg-blue-100 border-blue-600 text-blue-900', label: '$5', sizeClass: 'w-[110px] h-[46px] text-sm' },
      { id: '2d', value: 2, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '$2', isBimetallic: true, innerColor: 'bg-yellow-300', sizeClass: 'w-[56px] h-[56px] text-sm' },
      { id: '1d', value: 1, type: 'coin', color: 'bg-yellow-300 border-yellow-500 text-yellow-900', label: '$1', isPoly: true, polyPoints: 'polygon(50% 0%, 78% 10%, 98% 35%, 98% 65%, 78% 90%, 50% 100%, 22% 90%, 2% 65%, 2% 35%, 22% 10%)', sizeClass: 'w-[53px] h-[53px] text-sm' },
      { id: '25c', value: 0.25, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '25¢', sizeClass: 'w-[48px] h-[48px] text-sm' },
      { id: '10c', value: 0.10, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '10¢', sizeClass: 'w-[36px] h-[36px] text-xs' },
      { id: '5c', value: 0.05, type: 'coin', color: 'bg-gray-200 border-gray-400 text-gray-800', label: '5¢', sizeClass: 'w-[42px] h-[42px] text-xs' },
    ]
  }
};
