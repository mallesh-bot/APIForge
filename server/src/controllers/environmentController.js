import Environment from '../models/Environment.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { env } from '../config/env.js';

/**
 * Masks secret values in variables before sending to client.
 */
function maskEnvironmentSecrets(environmentDoc) {
  const obj = environmentDoc.toJSON ? environmentDoc.toJSON() : { ...environmentDoc };
  if (Array.isArray(obj.variables)) {
    obj.variables = obj.variables.map((v) => ({
      key: v.key,
      value: v.isSecret ? '********' : v.value,
      isSecret: Boolean(v.isSecret),
    }));
  }
  return obj;
}

export async function listEnvironments(req, res, next) {
  try {
    const environments = await Environment.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    const masked = environments.map(maskEnvironmentSecrets);

    return res.status(200).json({
      success: true,
      environments: masked,
    });
  } catch (err) {
    next(err);
  }
}

export async function createEnvironment(req, res, next) {
  try {
    const { name, variables = [] } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Environment name is required',
      });
    }

    const processedVariables = variables.map((v) => {
      const isSecret = Boolean(v.isSecret);
      let value = String(v.value || '');
      if (isSecret && value) {
        value = encrypt(value, env.ENCRYPTION_KEY);
      }
      return { key: String(v.key || '').trim(), value, isSecret };
    });

    const environment = await Environment.create({
      ownerId: req.user.id,
      name: name.trim(),
      variables: processedVariables,
    });

    return res.status(201).json({
      success: true,
      message: 'Environment created successfully',
      environment: maskEnvironmentSecrets(environment),
    });
  } catch (err) {
    next(err);
  }
}

export async function getEnvironment(req, res, next) {
  try {
    const environment = await Environment.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!environment) {
      return res.status(404).json({
        success: false,
        message: 'Environment not found',
      });
    }

    return res.status(200).json({
      success: true,
      environment: maskEnvironmentSecrets(environment),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEnvironment(req, res, next) {
  try {
    const environment = await Environment.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!environment) {
      return res.status(404).json({
        success: false,
        message: 'Environment not found',
      });
    }

    const { name, variables } = req.body;
    if (name !== undefined) environment.name = name.trim();

    if (Array.isArray(variables)) {
      environment.variables = variables.map((v) => {
        const isSecret = Boolean(v.isSecret);
        let value = String(v.value || '');

        // If it's a secret and user kept the masked placeholder "********", preserve existing encrypted value
        if (isSecret && value === '********') {
          const existingVar = environment.variables.find((old) => old.key === v.key);
          if (existingVar) {
            value = existingVar.value;
          }
        } else if (isSecret && value) {
          value = encrypt(value, env.ENCRYPTION_KEY);
        }

        return { key: String(v.key || '').trim(), value, isSecret };
      });
    }

    await environment.save();

    return res.status(200).json({
      success: true,
      message: 'Environment updated successfully',
      environment: maskEnvironmentSecrets(environment),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteEnvironment(req, res, next) {
  try {
    const environment = await Environment.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!environment) {
      return res.status(404).json({
        success: false,
        message: 'Environment not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Environment deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Internal helper to resolve decrypted key-value pairs for request execution.
 */
export async function getDecryptedEnvironmentMap(environmentId, userId) {
  if (!environmentId) return {};

  const environment = await Environment.findOne({
    _id: environmentId,
    ownerId: userId,
  });

  if (!environment) return {};

  const map = {};
  for (const v of environment.variables) {
    if (!v.key) continue;
    let resolvedValue = v.value || '';
    if (v.isSecret && resolvedValue) {
      try {
        resolvedValue = decrypt(resolvedValue, env.ENCRYPTION_KEY);
      } catch {
        resolvedValue = '';
      }
    }
    map[v.key] = resolvedValue;
  }
  return map;
}
