import { useSelector } from 'react-redux';
import { Box, Typography, Tooltip } from '@mui/material';
import { formatFileSize } from '../../utils/formatters';
import { getAccountColor } from '../../config/constants';

export const StorageBar = () => {
  const { connectedAccounts } = useSelector(s => s.drive);
  const accountsWithStorage = connectedAccounts.filter(a => a.storage);

  if (accountsWithStorage.length === 0) return null;

  const totalUsed = accountsWithStorage.reduce((sum, a) => sum + (a.storage?.used || 0), 0);
  const totalLimit = accountsWithStorage.reduce((sum, a) => sum + (a.storage?.limit || 0), 0);
  const totalPercent = totalLimit > 0 ? Math.min(100, Math.round((totalUsed / totalLimit) * 100)) : 0;

  const segments = accountsWithStorage.map(a => ({
    email: a.email,
    percent: totalLimit > 0 ? ((a.storage?.used || 0) / totalLimit) * 100 : 0,
    color: getAccountColor(a.email),
    used: a.storage?.used || 0,
    limit: a.storage?.limit || 0,
  }));

  return (
    <Box sx={{ px: 2, py: 2, borderTop: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary">Storage</Typography>
        <Typography variant="caption" color="text.secondary">{totalPercent}%</Typography>
      </Box>

      <Tooltip 
        title={
          <Box sx={{ p: 0.5 }}>
            {segments.map(seg => (
              <Box key={seg.email} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: seg.color, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ flex: 1, minWidth: 100 }} noWrap>{seg.email}</Typography>
                <Typography variant="caption" color="text.secondary">{formatFileSize(seg.used)}</Typography>
              </Box>
            ))}
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Total</Typography>
              <Typography variant="caption">{formatFileSize(totalUsed)} / {formatFileSize(totalLimit)}</Typography>
            </Box>
          </Box>
        }
        placement="top"
        arrow
      >
        <Box sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 4, display: 'flex', overflow: 'hidden', cursor: 'default' }}>
          {segments.map((seg, i) => (
            <Box
              key={seg.email}
              sx={{
                height: '100%',
                width: `${seg.percent}%`,
                bgcolor: seg.color,
                ml: i > 0 && seg.percent > 0 ? '1px' : 0,
                transition: 'all 0.5s',
              }}
            />
          ))}
        </Box>
      </Tooltip>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '0.65rem' }}>
        {formatFileSize(totalUsed)} of {formatFileSize(totalLimit)} used
      </Typography>
    </Box>
  );
};
