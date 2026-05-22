import { useState, useEffect } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { Modal } from '../common/Modal';

export const RenameModal = ({ open, onOpenChange, file, onRename }) => {
  const [name, setName] = useState(file?.name || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setName(file?.name || '');
  }, [open, file]);

  const handleSave = async () => {
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
    if (e.key === 'Enter') handleSave();
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Rename" size="sm">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="New name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          fullWidth
          variant="outlined"
          size="small"
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading || !name.trim()} disableElevation>
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
