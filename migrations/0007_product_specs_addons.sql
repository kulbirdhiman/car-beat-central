ALTER TABLE "products" ADD COLUMN "specs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "add_on_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
UPDATE "products" SET "specs" = '[["Screen","9\" HD touchscreen"],["Smartphone","Wireless Apple CarPlay & Android Auto"],["Radio","DAB+ digital radio"],["Equaliser","32-band EQ"],["Camera input","Reversing camera"],["Controls","Keeps steering-wheel controls"],["In the box","Vehicle-specific fascia and wiring harness"]]'::jsonb WHERE "id" = 'p1' AND "specs" = '[]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "specs" = '[["Type","6.5\" component (separate woofer + tweeter)"],["Power","100W RMS per pair"],["Tweeter","Silk dome"],["Crossover","Passive crossovers included"],["Mounting","Fits most front doors"]]'::jsonb WHERE "id" = 'p2' AND "specs" = '[]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "specs" = '[["Driver size","12\""],["Amplifier","Built-in 300W"],["Mounting","Under rear seat"],["Enclosure","Custom-fit"],["Controls","Remote bass knob"],["Designed for","Dual-cab utes and 4WDs"]]'::jsonb WHERE "id" = 'p3' AND "specs" = '[]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "specs" = '[["Channels","4 (bridgeable to 2)"],["Power","4 x 150W RMS"],["Total power","1200W"],["Class","Class-D"],["Inputs","High-level inputs for factory stereos"]]'::jsonb WHERE "id" = 'p4' AND "specs" = '[]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "specs" = '[["Front camera","4K"],["Rear camera","1080p"],["GPS","Speed & location"],["Connectivity","Wi-Fi app"],["Power backup","Supercapacitor (no battery)"],["Heat rating","Up to 70°C"],["Parking mode","Yes, with hardwire kit"]]'::jsonb WHERE "id" = 'p5' AND "specs" = '[]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "specs" = '[["Type","Fibre-optic ambient strips"],["Colours","64"],["Control","Phone app, music sync"],["Power","USB-C, plug-and-play"],["Length","6 metres"]]'::jsonb WHERE "id" = 'p6' AND "specs" = '[]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "specs" = '[["Charging","15W fast wireless"],["Compatibility","MagSafe compatible"],["Mounting","Vent and dash mounts included"],["Cooling","Built-in fan"]]'::jsonb WHERE "id" = 'p7' AND "specs" = '[]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "specs" = '[["Fit","Laser-measured for your model"],["Edges","Raised, waterproof"],["Backing","Anti-slip"],["In the box","Front and rear set"]]'::jsonb WHERE "id" = 'p8' AND "specs" = '[]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "specs" = '[["Screen","7\" touchscreen"],["Size","Double-DIN"],["Smartphone","Wired Apple CarPlay & Android Auto"],["Bluetooth","Hands-free calling"],["Camera input","Reversing camera"]]'::jsonb WHERE "id" = 'p9' AND "specs" = '[]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "specs" = '[["Size","6x9\""],["Design","3-way coaxial"],["Power","90W RMS per pair"],["Cones","Carbon fibre"],["In the box","Grilles included"]]'::jsonb WHERE "id" = 'p10' AND "specs" = '[]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "specs" = '[["Driver size","10\""],["Type","Powered bass tube"],["Amplifier","Built-in 250W"],["Inputs","High and low-level"],["Mounting","Quick-release straps"],["In the box","Wiring kit"]]'::jsonb WHERE "id" = 'p11' AND "specs" = '[]'::jsonb;
--> statement-breakpoint
UPDATE "products" SET "specs" = '[["Light source","LED matrix"],["Colour temperature","6500K daylight white"],["Compliance","ADR compliant"],["Waterproofing","IP68"],["Install","Plug-and-play harness"]]'::jsonb WHERE "id" = 'p12' AND "specs" = '[]'::jsonb;