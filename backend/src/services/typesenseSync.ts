import { typesenseClient } from '../config/typesense';
import { UserEntity } from '../types/entities';

// ─── Collections Initialization ──────────────────────────────────────────────

export async function initializeTypesenseCollections() {
  try {
    const collections = await typesenseClient.collections().retrieve();
    const existingNames = collections.map((c) => c.name);

    if (!existingNames.includes('users')) {
      await typesenseClient.collections().create({
        name: 'users',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'fullName', type: 'string' },
          { name: 'email', type: 'string' },
          { name: 'role', type: 'string' },
          { name: 'domain', type: 'string' },
          { name: 'skills', type: 'string[]', optional: true },
          { name: 'bio', type: 'string', optional: true },
          { name: 'workplace', type: 'string', optional: true },
          { name: 'reputationScore', type: 'int32', optional: true },
          { name: 'isBanned', type: 'bool', optional: true },
          { name: 'createdAt', type: 'int64', optional: true },
        ],
      });
      console.log('✅ Typesense collection created: users');
    }

    if (!existingNames.includes('jobs')) {
      await typesenseClient.collections().create({
        name: 'jobs',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'title', type: 'string' },
          { name: 'company', type: 'string' },
          { name: 'type', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'location', type: 'string', optional: true },
          { name: 'salary', type: 'string', optional: true },
          { name: 'postedBy', type: 'string' },
          { name: 'applicantsCount', type: 'int32', optional: true },
          { name: 'isActive', type: 'bool', optional: true },
          { name: 'createdAt', type: 'int64', optional: true },
        ],
      });
      console.log('✅ Typesense collection created: jobs');
    }

    if (!existingNames.includes('events')) {
      await typesenseClient.collections().create({
        name: 'events',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'date', type: 'string' },
          { name: 'location', type: 'string' },
          { name: 'type', type: 'string' },
          { name: 'rsvpCount', type: 'int32', optional: true },
          { name: 'createdBy', type: 'string' },
          { name: 'createdAt', type: 'int64', optional: true },
        ],
      });
      console.log('✅ Typesense collection created: events');
    }
  } catch (error) {
    console.error('❌ Error initializing Typesense collections:', error);
  }
}

// ─── Users Sync ─────────────────────────────────────────────────────────────

export async function syncUser(user: UserEntity | any) {
  try {
    const document = {
      id: user.id,
      fullName: user.fullName || '',
      email: user.email || '',
      role: user.role || 'STUDENT',
      domain: user.domain || '',
      skills: user.skills || [],
      bio: user.bio || '',
      workplace: user.workplace || '',
      reputationScore: user.reputationScore || 0,
      isBanned: !!user.isBanned,
      createdAt: user.createdAt ? new Date(user.createdAt).getTime() : Date.now(),
    };
    await typesenseClient.collections('users').documents().upsert(document);
  } catch (error) {
    console.error(`❌ Error syncing user ${user.id} to Typesense:`, error);
  }
}

export async function removeUser(userId: string) {
  try {
    await typesenseClient.collections('users').documents(userId).delete();
  } catch (error) {
    console.error(`❌ Error removing user ${userId} from Typesense:`, error);
  }
}

// ─── Jobs Sync ──────────────────────────────────────────────────────────────

export async function syncJob(job: any) {
  try {
    const document = {
      id: job.id,
      title: job.title || '',
      company: job.company || '',
      type: job.type || 'job',
      description: job.description || '',
      location: job.location || '',
      salary: job.salary || '',
      postedBy: job.postedBy || '',
      applicantsCount: job.applicantsCount || 0,
      isActive: job.isActive !== undefined ? job.isActive : true,
      createdAt: job.createdAt ? new Date(job.createdAt).getTime() : Date.now(),
    };
    await typesenseClient.collections('jobs').documents().upsert(document);
  } catch (error) {
    console.error(`❌ Error syncing job ${job.id} to Typesense:`, error);
  }
}

export async function removeJob(jobId: string) {
  try {
    await typesenseClient.collections('jobs').documents(jobId).delete();
  } catch (error) {
    console.error(`❌ Error removing job ${jobId} from Typesense:`, error);
  }
}

// ─── Events Sync ────────────────────────────────────────────────────────────

export async function syncEvent(event: any) {
  try {
    const document = {
      id: event.id,
      title: event.title || '',
      description: event.description || '',
      date: event.date || '',
      location: event.location || '',
      type: event.type || '',
      rsvpCount: event.rsvpCount || 0,
      createdBy: event.createdBy || '',
      createdAt: event.createdAt ? new Date(event.createdAt).getTime() : Date.now(),
    };
    await typesenseClient.collections('events').documents().upsert(document);
  } catch (error) {
    console.error(`❌ Error syncing event ${event.id} to Typesense:`, error);
  }
}

export async function removeEvent(eventId: string) {
  try {
    await typesenseClient.collections('events').documents(eventId).delete();
  } catch (error) {
    console.error(`❌ Error removing event ${eventId} from Typesense:`, error);
  }
}
