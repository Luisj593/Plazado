// Managed external export. Does not read data into logs or mutate production documents.
// Restore mode can target only a different project with an explicit -restore-test suffix.
import {initializeApp,cert,applicationDefault} from 'firebase-admin/app';
import fs from 'node:fs';
const mode=process.argv[2] || 'export';
const config=JSON.parse(fs.readFileSync(new URL('../firebase-applet-config.json',import.meta.url),'utf8'));
const sourceProject=process.env.FIREBASE_PROJECT_ID || config.projectId;
const sourceDatabase=process.env.FIREBASE_DATABASE_ID || config.firestoreDatabaseId;
const credential=process.env.FIREBASE_SERVICE_ACCOUNT?cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)):applicationDefault();
const app=initializeApp({credential,projectId:sourceProject});
const token=(await app.options.credential.getAccessToken()).access_token;
const request=async(path,body)=>{const response=await fetch(`https://firestore.googleapis.com/v1/${path}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`Firestore operation rejected: HTTP ${response.status}. Check IAM, billing and bucket access.`);return response.json();};
if(mode==='export'){
 const bucket=process.env.FIRESTORE_BACKUP_BUCKET;
 if(!bucket || !/^gs:\/\/[a-z0-9][a-z0-9._-]+$/.test(bucket))throw Error('Configure FIRESTORE_BACKUP_BUCKET as a private gs://bucket');
 const prefix=`${bucket}/plazado/${new Date().toISOString().replace(/[:.]/g,'-')}`;
 const operation=await request(`projects/${sourceProject}/databases/${sourceDatabase}:exportDocuments`,{outputUriPrefix:prefix});
 console.log(JSON.stringify({operation:operation.name,requestedOutput:prefix,complete:operation.done===true,notice:'Retain the operation name; use status to confirm export success. A requested export is not a completed backup.'}));
}else if(mode==='status'){
 const operation=process.env.FIRESTORE_BACKUP_OPERATION;
 const target=process.env.FIRESTORE_RESTORE_TEST_PROJECT;
 const sourceOperation=operation?.startsWith(`projects/${sourceProject}/databases/${sourceDatabase}/operations/`);
 const restoreOperation=target && target!==sourceProject && target.endsWith('-restore-test') && operation?.startsWith(`projects/${target}/databases/(default)/operations/`);
 if(!sourceOperation && !restoreOperation)throw Error('Configure the export or isolated restore operation name');
 const result=await request(operation);if(result.error)throw Error(`Export failed: code ${result.error.code}`);
 console.log(JSON.stringify({done:result.done===true,outputUriPrefix:result.response?.outputUriPrefix || result.metadata?.outputUriPrefix}));
}else if(mode==='restore-test'){
 const target=process.env.FIRESTORE_RESTORE_TEST_PROJECT,uri=process.env.FIRESTORE_RESTORE_URI;
 if(!target || target===sourceProject || !target.endsWith('-restore-test') || !/^gs:\/\/[a-z0-9][a-z0-9._-]+\/.+/.test(uri || ''))throw Error('Restore requires a different project ending in -restore-test and the completed export URI. Production restore is prohibited.');
 const operation=await request(`projects/${target}/databases/(default):importDocuments`,{inputUriPrefix:uri});
 console.log(JSON.stringify({target,operation:operation.name,complete:operation.done===true,notice:'Verify import completion and data integrity in the isolated project before recording restore success.'}));
}else throw Error('Use export, status or restore-test');
