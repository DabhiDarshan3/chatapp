<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Contracts\Encryption\DecryptException;

class EncryptedFallback implements CastsAttributes
{
    /**
     * Cast the given value.
     */
    public function get($model, $key, $value, $attributes)
    {
        if (is_null($value)) {
            return null;
        }

        try {
            // Attempt to decrypt the payload
            return Crypt::decryptString($value);
        } catch (DecryptException $e) {
            // If it fails, it means the text was stored as plain-text before encryption was introduced.
            // So we safely fallback to returning the original plain-text value.
            return $value;
        }
    }

    /**
     * Prepare the given value for storage.
     */
    public function set($model, $key, $value, $attributes)
    {
        if (is_null($value)) {
            return null;
        }

        // Always encrypt new messages before saving to the database
        return Crypt::encryptString($value);
    }
}
