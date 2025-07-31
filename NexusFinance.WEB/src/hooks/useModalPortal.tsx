import { useModal } from '../contexts/ModalContext';
import { ReactNode } from 'react';

export const useModalPortal = () => {
  const { showModal, hideModal, isModalOpen } = useModal();

  const openModal = (modalContent: ReactNode) => {
    showModal(modalContent);
  };

  const closeModal = () => {
    hideModal();
  };

  return {
    openModal,
    closeModal,
    isModalOpen
  };
}; 