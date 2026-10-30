import '@angular/compiler';
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { ErrorHandler, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEnIn from '@angular/common/locales/en-IN';
import { App } from './app';
import './styles.css';
import { log } from './diagnostics';

class PortalErrorHandler implements ErrorHandler {
  handleError(error:unknown){log('error','angular.unhandled_error',{errorType:error instanceof Error?error.name:'Unknown'});}
}

registerLocaleData(localeEnIn);
bootstrapApplication(App, {providers: [{provide: LOCALE_ID, useValue: 'en-IN'}, {provide:ErrorHandler,useClass:PortalErrorHandler}]}).catch(()=>{
  log('error','application.bootstrap.failed');
  const root=document.querySelector('app-root');
  if(root)root.textContent='Unable to start the portal. Please refresh the page. If the problem continues, contact support.';
});
