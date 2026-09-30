-- Smazat staré RLS politiky na tabulce addons
DROP POLICY IF EXISTS "Enable all for authenticated users on addons" ON addons;
DROP POLICY IF EXISTS "authenticated_insert_addons" ON addons;
DROP POLICY IF EXISTS "authenticated_update_addons" ON addons;
DROP POLICY IF EXISTS "authenticated_delete_addons" ON addons;

-- Smazat staré RLS politiky na tabulce addon_availability
DROP POLICY IF EXISTS "Enable all for authenticated users on addon_availability" ON addon_availability;
DROP POLICY IF EXISTS "authenticated_insert_addon_availability" ON addon_availability;
DROP POLICY IF EXISTS "authenticated_update_addon_availability" ON addon_availability;
DROP POLICY IF EXISTS "authenticated_delete_addon_availability" ON addon_availability;

-- Ověřit výsledek
SELECT 'Cleanup complete' as status;