import { StockData } from "@/lib/stock-data";
import { 
  TrendingUp, 
  Shield, 
  DollarSign, 
  Zap,
  ChevronLeft,
} from "lucide-react";

interface BackgroundStockCardProps {
  stock: StockData;
}

/**
 * This component renders a full-featured stock card for background display
 * It's optimized to be shown behind the active card with proper styling
 */
export default function BackgroundStockCard({ stock }: BackgroundStockCardProps) {
  const displayPrice = stock.price.toFixed(2);
  const realTimeChange = stock.change;

  return (
    <div className="h-full w-full bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      {/* Header with Stock Name and Price */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{stock.name}</h3>
            <p className="text-sm text-gray-500">{stock.ticker}</p>
          </div>
          <div className="flex flex-col items-end">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              stock.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              ${displayPrice}
            </div>
            <div className="mt-1 text-xs">
              <span className={`flex items-center ${
                realTimeChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {realTimeChange >= 0 ? 
                  <TrendingUp size={10} className="mr-1" /> : 
                  <ChevronLeft size={10} className="mr-1 rotate-90" />}
                {realTimeChange >= 0 ? '+' : ''}{realTimeChange}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chart Preview Area */}
      <div className="p-3 border-b border-gray-100 bg-white">
        <div className="h-28 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
          {/* Mini chart visualization based on stock change direction */}
          <div className="relative w-full h-full px-4 pt-2">
            <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
              <path
                d={`M0,40 C10,${realTimeChange >= 0 ? '35' : '45'} 20,${realTimeChange >= 0 ? '30' : '35'} 30,${realTimeChange >= 0 ? '25' : '40'} 
                    C40,${realTimeChange >= 0 ? '20' : '45'} 60,${realTimeChange >= 0 ? '15' : '38'} 70,${realTimeChange >= 0 ? '10' : '42'} 
                    S90,${realTimeChange >= 0 ? '5' : '45'} 100,${realTimeChange >= 0 ? '8' : '40'}`}
                className={`${realTimeChange >= 0 ? 'stroke-green-500' : 'stroke-red-500'} fill-none`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="p-3 grid grid-cols-2 gap-2 bg-white">
        {Object.entries(stock.metrics).map(([key, metricObj]) => {
          const metricName = key.charAt(0).toUpperCase() + key.slice(1);
          return (
            <div 
              key={key}
              className={`p-2 rounded-lg border ${
                metricObj.color === 'green' ? 'border-green-200' :
                metricObj.color === 'yellow' ? 'border-yellow-200' : 'border-red-200'
              }`}
            >
              <div className="flex items-center mb-1">
                <div className={`flex items-center justify-center rounded-full w-5 h-5 
                  ${metricObj.color === 'green' ? 'bg-green-100 text-green-600' :
                   metricObj.color === 'yellow' ? 'bg-amber-100 text-amber-600' : 
                   'bg-red-100 text-red-600'}`}
                >
                  {key === 'performance' && <TrendingUp size={12} />}
                  {key === 'stability' && <Shield size={12} />}
                  {key === 'value' && <DollarSign size={12} />}
                  {key === 'momentum' && <Zap size={12} />}
                </div>
                <span className="text-xs ml-1 text-gray-700">{metricName}</span>
              </div>
              <div className="text-sm font-medium">{metricObj.value}</div>
            </div>
          );
        })}
      </div>

      {/* Footer with description preview */}
      <div className="p-3 bg-white border-t border-gray-100">
        <p className="text-xs text-gray-600 line-clamp-2">
          {stock.description.length > 100 
            ? `${stock.description.substring(0, 100)}...` 
            : stock.description}
        </p>
      </div>
    </div>
  );
}