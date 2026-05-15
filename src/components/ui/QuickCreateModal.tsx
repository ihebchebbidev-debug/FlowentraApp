
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, CheckSquare, Layers, FileText, Package, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ContactForm } from '@/modules/contacts/components/ContactForm';
import { contactsApi } from '@/services/contactsApi';
import { toast } from 'sonner';
import { ArticleForm } from '@/modules/articles/components/ArticleForm';
import { articlesApi } from '@/services/api/articlesApi';
import { CreateInstallationModal } from '@/modules/field/installations/components/CreateInstallationModal';
import { CreateProjectModal } from '@/modules/tasks/components/CreateProjectModal';
import { QuickTaskModal } from '@/modules/tasks/components/QuickTaskModal';
import { CreateContactRequest } from '@/types/contacts';
import { CreateArticleRequest } from '@/types/articles';
import { InstallationDto } from '@/modules/field/installations/types';
import { Project, Task } from '@/modules/tasks/types';
import { TasksService } from '@/modules/tasks/services/tasks.service';
import { ProjectsService } from '@/modules/tasks/services/projects.service';

interface QuickCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickCreateModal({ open, onOpenChange }: QuickCreateModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // State for sub-modals
  const [showContactModal, setShowContactModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showInstallationModal, setShowInstallationModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Loading states
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);
  
  const handleActionClick = (actionKey: string) => {
    onOpenChange(false);
    
    switch (actionKey) {
      case 'quickCreate.newContact':
        setShowContactModal(true);
        break;
      case 'quickCreate.newArticle':
        setShowArticleModal(true);
        break;
      case 'quickCreate.newInstallation':
        setShowInstallationModal(true);
        break;
      case 'quickCreate.newProject':
        setShowProjectModal(true);
        break;
      case 'quickCreate.newTask':
        setShowTaskModal(true);
        break;
      case 'quickCreate.newOffer':
        // Offers are complex and best handled by the dedicated page
        navigate('/dashboard/offers/add');
        break;
      default:
        break;
    }
  };

  const handleCreateContact = async (data: any) => {
    try {
      setIsCreatingContact(true);
      const newContact = await contactsApi.create(data as CreateContactRequest);
      toast.success(t('contacts.addPage.success_message'));
      setShowContactModal(false);
      // Optional: Navigate to detail?
      // navigate(`/dashboard/contacts/${newContact.id}`);
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error(t('contacts.addPage.error_message'));
    } finally {
      setIsCreatingContact(false);
    }
  };

  const handleCreateArticle = async (data: CreateArticleRequest) => {
    try {
      setIsCreatingArticle(true);
      await articlesApi.create(data);
      toast.success(t('articles:add.success_message'));
      setShowArticleModal(false);
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error(t('articles:add.error_message'));
    } finally {
      setIsCreatingArticle(false);
    }
  };

  const handleInstallationCreated = (installation: InstallationDto) => {
    // Toast is handled inside the modal component usually, or we can add one here
    // toast.success(t('installations:create.success'));
    setShowInstallationModal(false);
  };

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await ProjectsService.createProject(projectData as any);
      toast.success(t('tasks:projects.createModal.success'));
      setShowProjectModal(false);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(t('tasks:projects.createModal.error'));
    }
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await TasksService.createProjectTask(taskData as any);
      toast.success(t('tasks:taskCreated'));
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(t('tasks:taskCreationError'));
    }
  };

  const actions = [
    { labelKey: 'quickCreate.newContact', icon: UserPlus },
    { labelKey: 'quickCreate.newTask', icon: CheckSquare },
    { labelKey: 'quickCreate.newProject', icon: Layers },
    { labelKey: 'quickCreate.newOffer', icon: FileText },
    { labelKey: 'quickCreate.newArticle', icon: Package },
    { labelKey: 'quickCreate.newInstallation', icon: Building }
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-lg font-semibold">{t('quickCreate.title')}</DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actions.map((action, idx, arr) => {
                const Icon = action.icon as any;
                const isLastOdd = idx === arr.length - 1 && arr.length % 2 === 1;
                const containerClass = isLastOdd ? 'sm:col-span-2 sm:flex sm:justify-center' : '';

                return (
                  <div key={action.labelKey} className={containerClass}>
                    <Button
                      onClick={() => handleActionClick(action.labelKey)}
                      className={`justify-start text-white w-full ${isLastOdd ? 'sm:w-auto' : ''}`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {t(action.labelKey)}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border">
            <div className="w-full flex justify-end">
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="mr-2">
                {t('quickCreate.cancel')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      {showContactModal && (
        <ContactForm
          open={showContactModal}
          onOpenChange={setShowContactModal}
          onSubmit={handleCreateContact}
          isLoading={isCreatingContact}
        />
      )}

      {/* Article Modal */}
      {showArticleModal && (
        <Dialog open={showArticleModal} onOpenChange={setShowArticleModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('articles:add.title')}</DialogTitle>
            </DialogHeader>
            <ArticleForm
              onSubmit={handleCreateArticle}
              onCancel={() => setShowArticleModal(false)}
              isSubmitting={isCreatingArticle}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Installation Modal */}
      {showInstallationModal && (
        <CreateInstallationModal
          open={showInstallationModal}
          onOpenChange={setShowInstallationModal}
          onInstallationCreated={handleInstallationCreated}
        />
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <CreateProjectModal
          isOpen={showProjectModal}
          onClose={() => setShowProjectModal(false)}
          onCreateProject={handleCreateProject}
        />
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <QuickTaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onCreateTask={handleCreateTask}
          technicians={[]} // You might need to fetch technicians if required by QuickTaskModal
          columns={[]} // You might need default columns or fetch them
        />
      )}
    </>
  );
}

export default QuickCreateModal;
