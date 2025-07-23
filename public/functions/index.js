// functions/index.js
const functions = require('firebase-functions');
const admin     = require('firebase-admin');

admin.initializeApp();

// Ao criar um usuário, já deixe como 'sdr' por padrão
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  return admin.auth().setCustomUserClaims(user.uid, { role: 'sdr' });
});

// Chamada HTTP (controller) para promover um usuário a gestor
exports.promoveParaGestor = functions.https.onCall(async (data, context) => {
  // só gestores existentes podem chamar
  if (!context.auth || context.auth.token.role !== 'gestor') {
    throw new functions.https.HttpsError('permission-denied',
      'Somente gestores podem atribuir esse papel.');
  }
  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument',
      'É necessário informar o uid do usuário.');
  }
  await admin.auth().setCustomUserClaims(uid, { role: 'gestor' });
  return { success: true };
});
