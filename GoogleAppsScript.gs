/**
 * Google Apps Script — armazenamento automático no Google Drive.
 *
 * 1) Crie uma pasta no Google Drive para o arquivo.
 * 2) Abra script.google.com e crie um projeto.
 * 3) Cole este código.
 * 4) Substitua DRIVE_FOLDER_ID e API_TOKEN.
 * 5) Implante como Web App: executar como você; acesso: Qualquer pessoa.
 * 6) Copie o URL do Web App para drive-config.js.
 */
const DRIVE_FOLDER_ID = 'COLE_AQUI_O_ID_DA_PASTA';
const API_TOKEN = 'COLE_AQUI_UMA_CHAVE_SECRETA_LONGA';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.token !== API_TOKEN) return json({ok:false,error:'Não autorizado.'});

    if (body.action === 'delete') {
      if (!body.fileId) return json({ok:false,error:'fileId em falta.'});
      try { DriveApp.getFileById(body.fileId).setTrashed(true); } catch (_) {}
      return json({ok:true});
    }

    if (body.action !== 'upload') return json({ok:false,error:'Ação inválida.'});
    if (!body.base64 || !body.fileName) return json({ok:false,error:'Ficheiro em falta.'});
    if (!/^application\/pdf$|^application\/msword$|^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$/.test(body.mimeType || '')) {
      return json({ok:false,error:'Tipo de ficheiro não permitido.'});
    }

    const bytes = Utilities.base64Decode(body.base64);
    if (bytes.length > 15 * 1024 * 1024) return json({ok:false,error:'Ficheiro superior a 15 MB.'});
    const blob = Utilities.newBlob(bytes, body.mimeType, body.fileName);
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const file = folder.createFile(blob);
    file.setName(body.fileName);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return json({
      ok:true,
      fileId:file.getId(),
      url:'https://drive.google.com/file/d/' + file.getId() + '/view?usp=sharing'
    });
  } catch (err) {
    return json({ok:false,error:String(err && err.message || err)});
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
