import {
  Folder, FileImage, FileVideo, FileAudio, FileText,
  FileSpreadsheet, File, Archive, FileCode, FileType2,
  Presentation,
} from 'lucide-react';
import { clsx } from 'clsx';

const ICON_MAP = {
  folder: { Icon: Folder, colorClass: 'text-amber-400' },
  image: { Icon: FileImage, colorClass: 'text-emerald-400' },
  video: { Icon: FileVideo, colorClass: 'text-purple-400' },
  audio: { Icon: FileAudio, colorClass: 'text-pink-400' },
  pdf: { Icon: FileType2, colorClass: 'text-red-400' },
  doc: { Icon: FileText, colorClass: 'text-blue-400' },
  sheet: { Icon: FileSpreadsheet, colorClass: 'text-green-400' },
  slide: { Icon: Presentation, colorClass: 'text-orange-400' },
  code: { Icon: FileCode, colorClass: 'text-cyan-400' },
  archive: { Icon: Archive, colorClass: 'text-slate-400' },
  other: { Icon: File, colorClass: 'text-slate-400' },
};

export const FileIcon = ({ category, size = 24, className }) => {
  const { Icon, colorClass } = ICON_MAP[category] || ICON_MAP.other;
  return <Icon size={size} className={clsx(colorClass, className)} strokeWidth={1.5} />;
};

export const getIconColors = (category) => {
  return ICON_MAP[category]?.colorClass || ICON_MAP.other.colorClass;
};
