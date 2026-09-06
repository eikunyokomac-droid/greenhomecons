import {env} from 'cloudflare:workers';
export function contactDb(){if(!env.DB)throw new Error('Contact storage unavailable');return env.DB;}
