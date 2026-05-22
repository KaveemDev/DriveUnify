import { createFolder, deleteFile, renameFile, listFiles } from '../../api/googleDriveApi';

export const createNewFolder = async (account, name, parentId = 'root') => {
  const { accessToken, email } = account;
  return createFolder(accessToken, name, parentId, email);
};

export const deleteFolderItem = async (account, fileId) => {
  const { accessToken, email } = account;
  return deleteFile(accessToken, fileId, email);
};

export const renameFolderItem = async (account, fileId, newName) => {
  const { accessToken, email } = account;
  return renameFile(accessToken, fileId, newName, email);
};

export const listFolderContents = async (account, folderId = 'root') => {
  const { accessToken, email } = account;
  const res = await listFiles(accessToken, {
    folderId,
    orderBy: 'folder,name',
    pageSize: 100,
  }, email);
  return res?.files || [];
};
