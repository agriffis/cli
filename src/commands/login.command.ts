import * as program from 'commander';
import * as inquirer from 'inquirer';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { AuthService } from 'jslib-common/abstractions/auth.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { CryptoFunctionService } from 'jslib-common/abstractions/cryptoFunction.service';
import { EnvironmentService } from 'jslib-common/abstractions/environment.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PasswordGenerationService } from 'jslib-common/abstractions/passwordGeneration.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { PolicyService } from 'jslib-common/abstractions/policy.service';
import { SyncService } from 'jslib-common/abstractions/sync.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { MessageResponse } from 'jslib-node/cli/models/response/messageResponse';

import { Utils } from 'jslib-common/misc/utils';

import { LoginCommand as BaseLoginCommand } from 'jslib-node/cli/commands/login.command';

export class LoginCommand extends BaseLoginCommand {
    private options: program.OptionValues;

    constructor(authService: AuthService, apiService: ApiService,
        cryptoFunctionService: CryptoFunctionService, syncService: SyncService,
        i18nService: I18nService, environmentService: EnvironmentService,
        passwordGenerationService: PasswordGenerationService, platformUtilsService: PlatformUtilsService,
        userService: UserService, cryptoService: CryptoService, policyService: PolicyService,
        private logoutCallback: () => Promise<void>) {
        super(authService, apiService, i18nService, environmentService, passwordGenerationService,
            cryptoFunctionService, platformUtilsService, userService, cryptoService, policyService,
            'cli', syncService);
        this.logout = this.logoutCallback;
        this.validatedParams = async () => {
            const key = await cryptoFunctionService.randomBytes(64);
            process.env.BW_SESSION = Utils.fromBufferToB64(key);
        };
        this.success = async () => {
            await syncService.fullSync(true);

            if ((this.options.sso != null || this.options.apikey != null) && this.canInteract) {
                const res = new MessageResponse('You are logged in!', '\n' +
                    'To unlock your vault, use the `unlock` command. ex:\n' +
                    '$ bw unlock');
                return res;
            } else {
                const res = new MessageResponse('You are logged in!', '\n' +
                    'To unlock your vault, set your session key to the `BW_SESSION` environment variable. ex:\n' +
                    '$ export BW_SESSION="' + process.env.BW_SESSION + '"\n' +
                    '> $env:BW_SESSION="' + process.env.BW_SESSION + '"\n\n' +
                    'You can also pass the session key to any command with the `--session` option. ex:\n' +
                    '$ bw list items --session ' + process.env.BW_SESSION);
                res.raw = process.env.BW_SESSION;
                return res;
            }
        };
    }

    run(email: string, password: string, options: program.OptionValues) {
        this.options = options;
        this.email = email;
        return super.run(email, password, options);
    }
}
