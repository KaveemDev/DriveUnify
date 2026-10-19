// Sample content for the home page demos. Placeholder names and files: swap before launch.
import { FileText, Presentation, FileSpreadsheet, FileImage } from 'lucide-react';

export const fileIcons = { pdf: FileText, doc: FileText, slide: Presentation, sheet: FileSpreadsheet, img: FileImage };

export const accounts = [
  { name: 'Work', email: 'aarav@northbeam.studio' },
  { name: 'Personal', email: 'aarav.mehta@gmail.com' },
  { name: 'School', email: 'am2291@halden.edu' },
];

export const files = [
  { name: 'Invoice 0412, Northbeam.pdf', type: 'pdf', account: 'Work', modified: 'Today', mb: 0.19 },
  { name: 'Q3 board deck final.pptx', type: 'slide', account: 'Work', modified: 'Today', mb: 14.2 },
  { name: 'Lease agreement 2026.pdf', type: 'pdf', account: 'Personal', modified: 'Yesterday', mb: 2.4 },
  { name: 'Thesis chapter 3 draft.docx', type: 'doc', account: 'School', modified: 'Mon', mb: 0.82 },
  { name: 'Invoice March, freelance.pdf', type: 'pdf', account: 'Personal', modified: '14 Oct', mb: 0.2 },
  { name: 'Financial model v4.xlsx', type: 'sheet', account: 'Personal', modified: '12 Oct', mb: 1.1 },
  { name: 'Client brief, Halden.docx', type: 'doc', account: 'Work', modified: '9 Oct', mb: 0.4 },
  { name: 'Lab report 6, titration.docx', type: 'doc', account: 'School', modified: '3 Oct', mb: 1.3 },
  { name: 'Seminar slides week 9.pptx', type: 'slide', account: 'School', modified: '30 Sep', mb: 9.7 },
  { name: 'Pitch deck, seed round.pptx', type: 'slide', account: 'Work', modified: '22 Sep', mb: 21.4 },
  { name: 'Passport scan.jpg', type: 'img', account: 'Personal', modified: '2 Sep', mb: 3.1 },
];

export const formatSize = (mb) => (mb < 1 ? `${Math.round(mb * 1000)} KB` : `${mb.toFixed(1)} MB`);
