import { useState, useEffect } from 'react';
import { TextField, Box, Typography } from '@mui/material';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Edit3, Check } from 'lucide-react';

export const RenameModal = ({ open, onOpenChange, file, onRename }) => {
  const [name, setName] = useState(file?.name || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setName(file?.name || '');
  }, [open, file]);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    const trimmed = name.trim();
    if (!trimmed || trimmed === file?.name) {
      onOpenChange(false);
      return;
    }
    setLoading(true);
    try {
      await onRename(file, trimmed);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave(e);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Rename Item"
      description="Enter a new title for this file or directory."
      size="sm"
    >
      <form onSubmit={handleSave}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ display: 'block', mb: 0.75 }}>
              New Name
            </Typography>
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', mr: 1 }}>
                    <Edit3 size={16} />
                  </Box>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  fontSize: '0.875rem',
                },
              }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              gap: 1.25,
              justifyContent: 'flex-end',
              pt: 0.5,
            }}
          >
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || !name.trim() || name.trim() === file?.name}
              loading={loading}
              icon={Check}
              className="w-full sm:w-auto"
            >
              Save Changes
            </Button>
          </Box>
        </Box>
      </form>
    </Modal>
  );
};

