import type {
  PaginatedResponse,
  CityList,
  CityDetail,
  VillageList,
  VillageDetail,
} from '~/types/village'

/**
 * Composable for fetching data from the Tourism Villages API.
 * Automatically sends Accept-Language header from current i18n locale.
 */
export function useApi() {
  const config = useRuntimeConfig()
  const { locale } = useI18n()

  const baseURL = computed(() => config.public.apiBase as string)

  const headers = computed(() => ({
    'Accept-Language': locale.value,
  }))

  /**
   * Fetch paginated list of cities.
   */
  function fetchCities() {
    return useFetch<PaginatedResponse<CityList>>('/cities/', {
      baseURL: baseURL.value,
      headers: headers.value,
      watch: [locale],
    })
  }

  /**
   * Fetch single city by slug (includes its villages).
   */
  function fetchCityBySlug(slug: string) {
    return useFetch<CityDetail>(`/cities/${slug}/`, {
      baseURL: baseURL.value,
      headers: headers.value,
      watch: [locale],
    })
  }

  /**
   * Fetch villages filtered by city slug.
   */
  function fetchVillagesByCity(citySlug: string) {
    return useFetch<PaginatedResponse<VillageList>>('/villages/', {
      baseURL: baseURL.value,
      headers: headers.value,
      params: { city: citySlug },
      watch: [locale],
    })
  }

  /**
   * Fetch single village by slug (includes gallery & comments).
   */
  function fetchVillageBySlug(slug: string) {
    return useFetch<VillageDetail>(`/villages/${slug}/`, {
      baseURL: baseURL.value,
      headers: headers.value,
      watch: [locale],
    })
  }

  return {
    fetchCities,
    fetchCityBySlug,
    fetchVillagesByCity,
    fetchVillageBySlug,
  }
}
