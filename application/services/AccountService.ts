import "server-only";

import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import type { UserRepository } from "@domain/user/UserRepository";

import { requireUserId } from "../auth/requireUserId";
import type { CurrentUserDto } from "../dto/CurrentUserDto";
import type { AccountGateway } from "../ports/AccountGateway";
import type { SessionProvider } from "../ports/SessionProvider";

/** The signed-in user's account. */
export class AccountService {
  constructor(
    private readonly sessions: SessionProvider,
    private readonly users: UserRepository,
    private readonly campaigns: CampaignRepository,
    private readonly accountGateway: AccountGateway,
  ) {}

  async getCurrentUser(): Promise<CurrentUserDto> {
    const userId = await requireUserId(this.sessions);
    const user = await this.users.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return { name: user.name, email: user.email };
  }

  /** Throws `NotAuthenticatedError` if no one is signed in. */
  async requireCurrentUserId(): Promise<void> {
    await requireUserId(this.sessions);
  }

  /**
   * Deletes the signed-in user. Deleting the user deletes their campaigns and
   * designs too; the design images are stored separately, so they're deleted
   * here.
   */
  async deleteAccount(): Promise<void> {
    const userId = await requireUserId(this.sessions);

    // Read first, since deleting the user deletes the designs that point to
    // the images.
    const imageRefs =
      await this.campaigns.findAllDesignImageRefsByOwner(userId);

    // Throws if the delete is refused. Images are only deleted after this
    // succeeds, so a refused delete leaves the account intact.
    await this.accountGateway.deleteCurrentAccount();

    await this.campaigns.deleteDesignImages(imageRefs);
  }
}
