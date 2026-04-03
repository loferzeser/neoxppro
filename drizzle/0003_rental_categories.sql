ALTER TABLE `products`
  MODIFY COLUMN `category` enum(
    'scalping',
    'swing',
    'grid',
    'hedging',
    'trend',
    'arbitrage',
    'indicator_tv',
    'strategy_tv',
    'script_tv',
    'tool',
    'other'
  ) NOT NULL DEFAULT 'other';
--> statement-breakpoint
ALTER TABLE `products`
  ADD COLUMN `saleType` enum('buy_once', 'rent', 'both') NOT NULL DEFAULT 'buy_once',
  ADD COLUMN `rentalPrice` decimal(10,2),
  ADD COLUMN `rentalDurationDays` int;
