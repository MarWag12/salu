import {
    IconBath, IconBolt, IconBug, IconBulb, IconDeviceTv, IconDoor, IconDroplet, IconFlame, IconHammer,
    IconHome, IconLeaf, IconLock, IconPaint, IconBrush, IconPlug, IconRuler, IconSnowflake, IconSofa,
    IconSparkles, IconTools, IconTruck, IconWall, IconWifi, IconWind,
    type TablerIcon,
} from '@tabler/icons-react';

/** Mesmo conjunto que App\Models\Category::ICONS (o valor guardado na base de dados é "ti-…"). */
const ICONS: Record<string, TablerIcon> = {
    'ti-bolt': IconBolt, 'ti-droplet': IconDroplet, 'ti-paint': IconPaint, 'ti-hammer': IconHammer,
    'ti-snowflake': IconSnowflake, 'ti-lock': IconLock, 'ti-sparkles': IconSparkles, 'ti-tools': IconTools,
    'ti-home': IconHome, 'ti-bulb': IconBulb, 'ti-plug': IconPlug, 'ti-flame': IconFlame,
    'ti-brush': IconBrush, 'ti-ruler': IconRuler, 'ti-bug': IconBug, 'ti-leaf': IconLeaf,
    'ti-truck': IconTruck, 'ti-wifi': IconWifi, 'ti-device-tv': IconDeviceTv, 'ti-wall': IconWall,
    'ti-wind': IconWind, 'ti-door': IconDoor, 'ti-bath': IconBath, 'ti-sofa': IconSofa,
};

export default function CategoryIcon({ name, size = 28, stroke = 1.8 }: { name?: string | null; size?: number; stroke?: number }) {
    const Cmp = (name && ICONS[name]) || IconTools;

    return <Cmp size={size} stroke={stroke} />;
}
