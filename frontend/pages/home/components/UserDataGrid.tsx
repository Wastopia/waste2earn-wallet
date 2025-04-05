import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Dialog, DialogTitle, DialogContent, IconButton, Button, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { LocalRxdbDatabase } from '@database/local-rxdb';
import { useSnackbar } from 'notistack';
import { kycService } from '@/services/kyc';
import { KYCDetails } from '@/@types/kyc';

interface UserDataGridProps {
  open: boolean;
  onClose: () => void;
  userPrincipal?: string;
}

type KYCStatus = 'pending' | 'approved' | 'rejected';
type RiskLevel = 'low' | 'medium' | 'high';

interface UserGridData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userType: 'validator' | 'collector' | 'regular';
  status: 'pending' | 'approved' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

const UserDataGrid: React.FC<UserDataGridProps> = ({ open, onClose, userPrincipal }) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState<UserGridData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userPrincipal) {
      loadUsers();
    }
  }, [open, userPrincipal]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const db = LocalRxdbDatabase.instance;
      
      // Get all users and their KYC details
      const allUsers = await Promise.all(
        (await db.getContacts()).map(async (contact) => {
          const kyc: KYCDetails | null = await db.getKYCDetails(contact.principal);
          if (!kyc) return null;
          
          const userData: UserGridData = {
            id: kyc.userId,
            firstName: kyc.personalInfo?.firstName || '',
            lastName: kyc.personalInfo?.lastName || '',
            email: kyc.personalInfo?.email || '',
            phoneNumber: kyc.personalInfo?.phoneNumber || '',
            userType: kyc.userType,
            status: kyc.status,
            riskLevel: kyc.riskLevel,
            createdAt: kyc.verificationDetails?.submittedAt 
              ? new Date(kyc.verificationDetails.submittedAt).toLocaleDateString()
              : '',
            updatedAt: kyc.updatedAt 
              ? new Date(kyc.updatedAt).toLocaleDateString()
              : ''
          };
          
          return userData;
        })
      );

      // Filter out null values and set users
      setUsers(allUsers.filter((user): user is UserGridData => user !== null));
    } catch (error) {
      console.error('Error loading users:', error);
      enqueueSnackbar(t('Failed to load user data'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: KYCStatus) => {
    try {
      setLoading(true);
      const currentKYC = await kycService.getKYCDetails(userId);
      if (!currentKYC) throw new Error('KYC details not found');

      await kycService.updateKYC(userId, {
        ...currentKYC,
        status: newStatus,
        updatedAt: Date.now(),
        verificationDetails: {
          ...currentKYC.verificationDetails,
          verifiedAt: Date.now(),
          verifiedBy: userPrincipal
        }
      });
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, status: newStatus, updatedAt: new Date().toLocaleDateString() }
            : user
        )
      );
      
      enqueueSnackbar(t('Status updated successfully'), { variant: 'success' });
    } catch (error) {
      console.error('Error updating status:', error);
      enqueueSnackbar(t('Failed to update status'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRiskLevelChange = async (userId: string, newRiskLevel: RiskLevel) => {
    try {
      setLoading(true);
      const currentKYC = await kycService.getKYCDetails(userId);
      if (!currentKYC) throw new Error('KYC details not found');

      await kycService.updateKYC(userId, {
        ...currentKYC,
        riskLevel: newRiskLevel,
        updatedAt: Date.now()
      });
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, riskLevel: newRiskLevel, updatedAt: new Date().toLocaleDateString() }
            : user
        )
      );
      
      enqueueSnackbar(t('Risk level updated successfully'), { variant: 'success' });
    } catch (error) {
      console.error('Error updating risk level:', error);
      enqueueSnackbar(t('Failed to update risk level'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'firstName', headerName: t('First Name'), width: 130 },
    { field: 'lastName', headerName: t('Last Name'), width: 130 },
    { field: 'email', headerName: t('Email'), width: 200 },
    { field: 'phoneNumber', headerName: t('Phone'), width: 130 },
    { 
      field: 'userType', 
      headerName: t('User Type'), 
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={t(params.value)} 
          color="primary" 
          size="small"
          className="capitalize"
        />
      )
    },
    {
      field: 'status',
      headerName: t('Status'),
      width: 130,
      renderCell: (params) => (
        <div className="flex gap-2">
          <Chip 
            label={t(params.value)}
            color={getStatusColor(params.value)}
            size="small"
            className="capitalize"
          />
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              const newStatus = params.value === 'pending' ? 'approved' : 'pending';
              handleStatusChange(params.row.id, newStatus as KYCStatus);
            }}
          >
            {params.value === 'pending' ? t('Approve') : t('Reset')}
          </Button>
        </div>
      )
    },
    {
      field: 'riskLevel',
      headerName: t('Risk Level'),
      width: 130,
      renderCell: (params) => (
        <div className="flex gap-2">
          <Chip 
            label={t(params.value)}
            color={getRiskLevelColor(params.value)}
            size="small"
            className="capitalize"
          />
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              const levels = ['low', 'medium', 'high'];
              const currentIndex = levels.indexOf(params.value);
              const newLevel = levels[(currentIndex + 1) % levels.length];
              handleRiskLevelChange(params.row.id, newLevel as RiskLevel);
            }}
          >
            {t('Change')}
          </Button>
        </div>
      )
    },
    { field: 'createdAt', headerName: t('Created At'), width: 130 },
    { field: 'updatedAt', headerName: t('Updated At'), width: 130 }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <div className="flex justify-between items-center">
          <span>{t('User Data Management')}</span>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent>
        <div style={{ height: 600 }}>
          <DataGrid
            rows={users}
            columns={columns}
            loading={loading}
            pageSizeOptions={[5, 10, 25, 50]}
            disableRowSelectionOnClick
            autoPageSize
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDataGrid; 