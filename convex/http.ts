import { httpRouter } from "convex/server";
import { auth } from "./auth";
import {preflight,uploadAudio,readAudio,pull,complete,fail} from './assessmentHttp';

const http = httpRouter();
auth.addHttpRoutes(http);
http.route({path:'/speaking/audio',method:'OPTIONS',handler:preflight});
http.route({path:'/speaking/audio',method:'POST',handler:uploadAudio});
http.route({path:'/speaking/audio',method:'GET',handler:readAudio});
http.route({path:'/assessor/pull',method:'POST',handler:pull});
http.route({path:'/assessor/complete',method:'POST',handler:complete});
http.route({path:'/assessor/fail',method:'POST',handler:fail});
export default http;
