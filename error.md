Run npm run -w backend-api lint

> faildaily-backend-api@1.0.0 lint
> eslint . --ext .js,.cjs,.mjs


/home/runner/work/FailDaily/FailDaily/backend-api/fix-missing-badges.js
Warning:   2:7  warning  'express' is assigned a value but never used  no-unused-vars

/home/runner/work/FailDaily/FailDaily/backend-api/server.js
Warning:    11:7   warning  'rateLimitMonitor' is assigned a value but never used  no-unused-vars
Warning:    26:70  warning  '_' is defined but never used                          no-unused-vars
Warning:    29:63  warning  '_' is defined but never used                          no-unused-vars
Warning:    32:61  warning  '_' is defined but never used                          no-unused-vars
Warning:   222:27  warning  'next' is defined but never used                       no-unused-vars

/home/runner/work/FailDaily/FailDaily/backend-api/src/controllers/commentsController.js
Warning:    59:14  warning  '_' is defined but never used                no-unused-vars
Warning:   107:13  warning  'fail' is assigned a value but never used    no-unused-vars
Warning:   198:13  warning  'userId' is assigned a value but never used  no-unused-vars
Warning:   219:13  warning  'fail' is assigned a value but never used    no-unused-vars

/home/runner/work/FailDaily/FailDaily/backend-api/src/controllers/debugController.js
Warning:   251:16  warning  'error' is defined but never used  no-unused-vars
Warning:   259:16  warning  'error' is defined but never used  no-unused-vars
Warning:   267:16  warning  'error' is defined but never used  no-unused-vars
Warning:   277:16  warning  'error' is defined but never used  no-unused-vars
Warning:   285:16  warning  'error' is defined but never used  no-unused-vars

/home/runner/work/FailDaily/FailDaily/backend-api/src/controllers/failsController.js
Warning:     96:13  warning  'result' is assigned a value but never used    no-unused-vars
Warning:    896:9   warning  'tags' is assigned a value but never used      no-unused-vars
Warning:   1046:13  warning  'limitNum' is assigned a value but never used  no-unused-vars
Warning:   1152:16  warning  '_' is defined but never used                  no-unused-vars

/home/runner/work/FailDaily/FailDaily/backend-api/src/controllers/reactionsController.js
Warning:     1:23  warning  'executeTransaction' is assigned a value but never used                    no-unused-vars
Warning:   246:13  warning  'fail' is assigned a value but never used                                  no-unused-vars
Error:   451:16  error    Do not access Object.prototype method 'hasOwnProperty' from target object  no-prototype-builtins

/home/runner/work/FailDaily/FailDaily/backend-api/src/middleware/auth.js
Warning:   103:12  warning  'error' is defined but never used  no-unused-vars

/home/runner/work/FailDaily/FailDaily/backend-api/src/routes/admin.js
Warning:   1190:12  warning  'error' is defined but never used  no-unused-vars

/home/runner/work/FailDaily/FailDaily/backend-api/src/routes/comments.js
Warning:    66:14  warning  '_' is defined but never used  no-unused-vars
Warning:   123:14  warning  '_' is defined but never used  no-unused-vars

/home/runner/work/FailDaily/FailDaily/backend-api/src/routes/failsNew.js
Warning:   4:28  warning  'optionalAuth' is assigned a value but never used  no-unused-vars
Warning:   5:9   warning  'executeQuery' is assigned a value but never used  no-unused-vars

/home/runner/work/FailDaily/FailDaily/backend-api/src/routes/registration.js
Warning:   146:13  warning  'code' is assigned a value but never used               no-unused-vars
Warning:   175:7   warning  'agreeToNewsletter' is assigned a value but never used  no-unused-vars
Warning:   259:9   warning  'referralData' is assigned a value but never used       no-unused-vars
Warning:   267:11  warning  'profileId' is assigned a value but never used          no-unused-vars
Warning:   478:14  warning  'jwtError' is defined but never used                    no-unused-vars

/home/runner/work/FailDaily/FailDaily/backend-api/src/utils/logger.js
  20:5  warning  Unused eslint-disable directive (no problems were reported from 'no-console')

/home/runner/work/FailDaily/FailDaily/backend-api/test-registration.js
Warning:   35:14  warning  'e' is defined but never used  no-unused-vars

✖ 35 problems (1 error, 34 warnings)
  0 errors and 1 warning potentially fixable with the `--fix` option.

npm error Lifecycle script `lint` failed with error:
npm error code 1
npm error path /home/runner/work/FailDaily/FailDaily/backend-api
npm error workspace faildaily-backend-api@1.0.0
npm error location /home/runner/work/FailDaily/FailDaily/backend-api
npm error command failed
npm error command sh -c eslint . --ext .js,.cjs,.mjs
Error: Process completed with exit code 1.
