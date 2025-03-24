import { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Dialog, DialogTitle, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: string;
  riskLevel: string;
  createdAt: number;
  updatedAt: number;
}

interface UserDataGridProps {
  open: boolean;
  onClose: () => void;
}

const UserDataGrid: React.FC<UserDataGridProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/getAllUsers');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open]);

  const columns: GridColDef[] = [
    { field: 'userId', headerName: t('user.id'), width: 130 },
    { field: 'firstName', headerName: t('user.firstName'), width: 130 },
    { field: 'lastName', headerName: t('user.lastName'), width: 130 },
    { field: 'email', headerName: t('user.email'), width: 200 },
    { field: 'phoneNumber', headerName: t('user.phoneNumber'), width: 150 },
    { 
      field: 'status', 
      headerName: t('user.status'), 
      width: 130,
      renderCell: (params) => (
        <Box
          sx={{
            color: params.value === 'approved' ? 'success.main' :
                   params.value === 'rejected' ? 'error.main' :
                   'warning.main',
            fontWeight: 'bold'
          }}
        >
          {params.value}
        </Box>
      )
    },
    { 
      field: 'riskLevel', 
      headerName: t('user.riskLevel'), 
      width: 130,
      renderCell: (params) => (
        <Box
          sx={{
            color: params.value === 'low' ? 'success.main' :
                   params.value === 'high' ? 'error.main' :
                   'warning.main',
            fontWeight: 'bold'
          }}
        >
          {params.value}
        </Box>
      )
    },
    { 
      field: 'createdAt', 
      headerName: t('user.createdAt'), 
      width: 180,
      valueFormatter: (params: { value: number }) => new Date(params.value).toLocaleString()
    },
    { 
      field: 'updatedAt', 
      headerName: t('user.updatedAt'), 
      width: 180,
      valueFormatter: (params: { value: number }) => new Date(params.value).toLocaleString()
    }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <span>{t('user.title')}</span>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <Box sx={{ height: 600, width: '100%', p: 2 }}>
        <DataGrid
          rows={users}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          loading={loading}
          disableRowSelectionOnClick
          getRowId={(row) => row.userId}
        />
      </Box>
    </Dialog>
  );
};

export default UserDataGrid; 